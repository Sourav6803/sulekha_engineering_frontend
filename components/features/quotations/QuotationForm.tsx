'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { BOQItemsEditor } from './BOQItemsEditor';
import { STRUCTURE_OPTIONS, formatDocumentAmount } from './quotationDisplay';
import { formatINR } from '@/lib/format';
import type {
  QuotationDefaults,
  QuotationDocument,
  QuotationItem,
  QuotationNextNumber,
  QuotationNumberCheck,
  QuotationPayload,
  QuotationStatus,
  QuotationType,
  StructureType,
} from '@/types/quotation';

/** Mirrors parseQuotationNo on the server: PREFIX/SCHEME/FY/SEQUENCE. */
const QUOTATION_NUMBER_PATTERN =
  /^[A-Z0-9]{1,10}\s*\/\s*[A-Z0-9]{2,12}\s*\/\s*\d{4}\s*[-–—]\s*\d{2,4}\s*\/\s*\d{1,6}$/i;

/** The server matches numbers with the spaces around the slashes ignored. */
const normaliseNumber = (value: string) => value.trim().replace(/\s*\/\s*/g, '/').toUpperCase();

const STATUS_OPTIONS: Array<{ value: QuotationStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

/**
 * Fallbacks used only until /quotations/defaults arrives. The real values come
 * from the CompanyProfile, so panel sizing, the line limit, the validity and the
 * scheme list are configured in exactly one place on the server.
 */
const FALLBACK_PANEL_SIZING_FACTOR = 1.2;
const FALLBACK_PANEL_WP = 610;
const FALLBACK_ITEM_LIMIT = 14;
const FALLBACK_VALIDITY_DAYS = 7;

const FALLBACK_SCHEMES: Array<{ code: string; label?: string }> = [
  { code: 'PMSGY', label: 'PM Surya Ghar Muft Bijli Yojana' },
  { code: 'GP', label: 'Gram Panchayat' },
  { code: 'SOLAR', label: 'Solar' },
  { code: 'MBECL', label: 'MBECL' },
];

interface FormState {
  customerName: string;
  consumerId: string;
  phoneNo: string;
  addressLine1: string;
  addressLine2: string;
  /* The delivery block, which the business sheet prints beside Bill To. */
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  district: string;
  pincode: string;
  systemSizeKW: string;
  panelWp: string;
  panelQty: string;
  panelBrand: string;
  inverterCapacityKW: string;
  inverterBrand: string;
  structureType: StructureType;
  schemeCode: string;
  issueDate: string;
  validityDays: string;
  amount: string;
  amountIncludesGST: boolean;
  status: QuotationStatus;
  notes: string;
}

interface QuotationFormProps {
  initial?: QuotationDocument | null;
  mode: 'create' | 'edit';
  /**
   * Which sheet is being written. The consumer sheet is the fixed domestic
   * template; the business sheet is free-form, with its own specification
   * column and named plant sections. Defaults to the consumer sheet so every
   * existing caller keeps its behaviour.
   */
  quotationType?: QuotationType;
  submitting?: boolean;
  nextNumber?: QuotationNextNumber | null;
  /** Fixed company values (terms, sizing, line limit). Fetched by the page. */
  defaults?: QuotationDefaults | null;
  /** Lets the page refresh the "next number" preview when the scheme changes. */
  onSchemeChange?: (schemeCode: string) => void;
  /**
   * Same, for the date: the previewed number carries a financial year, so it goes
   * stale when the date is moved across 1 April.
   */
  onIssueDateChange?: (issueDate: string) => void;
  /**
   * Asks the server whether a typed number is still free. Create only. Returns
   * null when the check itself could not run, which is treated as "unknown" — a
   * failed check must never block a save.
   */
  onCheckNumber?: (params: { quotationNo: string; issueDate?: string }) => Promise<QuotationNumberCheck | null>;
  onSubmit: (payload: QuotationPayload) => void | Promise<void>;
}

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const todayInput = (): string => toDateInput(new Date().toISOString());

const emptyForm = (
  panelWp: number = FALLBACK_PANEL_WP,
  validityDays: number = FALLBACK_VALIDITY_DAYS
): FormState => ({
  customerName: '',
  consumerId: '',
  phoneNo: '',
    addressLine1: '',
    addressLine2: '',
    shipToName: '',
    shipToAddress: '',
    shipToPhone: '',
  district: '',
  pincode: '',
  systemSizeKW: '',
  panelWp: String(panelWp),
  panelQty: '',
  panelBrand: 'Waaree/Adani',
  inverterCapacityKW: '',
  inverterBrand: 'Deye/any',
  structureType: 'high_rise',
  schemeCode: 'PMSGY',
  issueDate: todayInput(),
  validityDays: String(validityDays),
  amount: '',
  amountIncludesGST: true,
  status: 'draft',
  notes: '',
});

const fromQuotation = (quotation: QuotationDocument): FormState => ({
  customerName: quotation.customerName ?? '',
  consumerId: quotation.consumerId ?? '',
  phoneNo: quotation.phoneNo ?? '',
    addressLine1: quotation.addressLine1 ?? '',
    addressLine2: quotation.addressLine2 ?? '',
    shipToName: quotation.shipTo?.name ?? '',
    // One line per row, so the printed block keeps the shape it was typed in.
    shipToAddress: (quotation.shipTo?.addressLines ?? []).join('\n'),
    shipToPhone: quotation.shipTo?.phone ?? '',
  district: quotation.district ?? '',
  pincode: quotation.pincode ?? '',
  systemSizeKW: quotation.systemSizeKW != null ? String(quotation.systemSizeKW) : '',
  panelWp: quotation.panelWp != null ? String(quotation.panelWp) : String(FALLBACK_PANEL_WP),
  panelQty: quotation.panelQty != null ? String(quotation.panelQty) : '',
  panelBrand: quotation.panelBrand ?? '',
  inverterCapacityKW: quotation.inverterCapacityKW != null ? String(quotation.inverterCapacityKW) : '',
  inverterBrand: quotation.inverterBrand ?? '',
  structureType: quotation.structureType ?? 'high_rise',
  schemeCode: quotation.schemeCode ?? 'PMSGY',
  issueDate: toDateInput(quotation.issueDate) || todayInput(),
  validityDays: quotation.validityDays != null ? String(quotation.validityDays) : '7',
  amount: quotation.amount != null ? String(quotation.amount) : '',
  amountIncludesGST: quotation.amountIncludesGST !== false,
  status: quotation.status === 'converted' ? 'accepted' : quotation.status ?? 'draft',
  notes: quotation.notes ?? '',
});

/**
 * Mirrors the server side rules in validations/quotation.validation.js so the
 * user sees the problem before the request is made. The server remains the
 * authority.
 */
const validate = (
  form: FormState,
  items: QuotationItem[],
  itemLimit: number = FALLBACK_ITEM_LIMIT,
  /** Business sheets may be a material supply with no single kW figure. */
  isBusinessSheet = false
): string | null => {
  const name = form.customerName.trim();
  if (name.length < 2) return 'Customer name is required (at least 2 characters).';
  if (name.length > 120) return 'Customer name cannot exceed 120 characters.';

  if (form.consumerId && !/^\d{5,20}$/.test(form.consumerId.trim())) {
    return 'Consumer ID must be 5 to 20 digits.';
  }
  if (form.phoneNo && !/^\d{10}$/.test(form.phoneNo.trim())) {
    return 'Mobile number must be exactly 10 digits.';
  }
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    return 'PIN code must be 6 digits.';
  }

  /*
   * The domestic sheet is priced on system size, so it is mandatory there. A
   * business sheet is often a project to a partner, or a plain material supply,
   * with no single kW figure — so it is optional and simply left unprinted when
   * blank rather than blocking the quotation.
   */
  if (form.systemSizeKW) {
    const kW = Number(form.systemSizeKW);
    if (Number.isNaN(kW) || kW < 0.1 || kW > 100) {
      return 'System size must be between 0.1 and 100 kW.';
    }
  } else if (!isBusinessSheet) {
    return 'System size must be between 0.1 and 100 kW.';
  }

  if (form.panelWp && (Number(form.panelWp) < 100 || Number(form.panelWp) > 1000)) {
    return 'Panel watt-peak must be between 100 and 1000 Wp.';
  }
  if (form.inverterCapacityKW && Number(form.inverterCapacityKW) < 0.1) {
    return 'Inverter capacity must be at least 0.1 kW.';
  }
  if (form.validityDays && (Number(form.validityDays) < 1 || Number(form.validityDays) > 365)) {
    return 'Validity must be between 1 and 365 days.';
  }

  if (form.issueDate) {
    const issue = new Date(form.issueDate);
    if (Number.isNaN(issue.getTime())) return 'Quotation date is not valid.';
    if (issue.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) {
      return 'Quotation date cannot be more than 30 days in the future.';
    }
  }

  if (form.amount !== '' && Number(form.amount) < 0) return 'Amount cannot be negative.';
  if (items.length > itemLimit) return `A quotation can hold at most ${itemLimit} BOQ lines.`;

  for (const [index, item] of items.entries()) {
    if (!item.description?.trim()) return `BOQ line ${index + 1} needs a description.`;
    if (!Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0) {
      return `BOQ line ${index + 1} needs a quantity greater than 0.`;
    }
  }

  return null;
};

export function QuotationForm({
  initial = null,
  mode,
  quotationType = 'consumer',
  submitting = false,
  nextNumber = null,
  defaults = null,
  onSchemeChange,
  onIssueDateChange,
  onCheckNumber,
  onSubmit,
}: QuotationFormProps) {
  // Server driven settings, with safe fallbacks until /defaults arrives.
  const panelWpDefault = defaults?.defaultPanelWp ?? FALLBACK_PANEL_WP;
  const sizingFactor = defaults?.panelSizingFactor ?? FALLBACK_PANEL_SIZING_FACTOR;
  const validityDefault = defaults?.validityDays ?? FALLBACK_VALIDITY_DAYS;
  const schemeList = defaults?.schemes?.length ? defaults.schemes : FALLBACK_SCHEMES;

  /*
   * What this sheet carries. The server describes both sheets in /defaults, so
   * the form and the printed document cannot disagree about the columns, the
   * line limit or whether the total includes GST. The fallbacks below only apply
   * until that request lands.
   */
  const typeOption = defaults?.quotationTypes?.find((option) => option.value === quotationType);
  const isBusinessSheet = quotationType === 'partner';
  const itemLimit = typeOption?.itemLimit ?? (isBusinessSheet ? 30 : defaults?.quotationItemLimit ?? FALLBACK_ITEM_LIMIT);
  const showSpecificationColumn = typeOption?.showSpecificationColumn ?? isBusinessSheet;
  const showSections = typeOption?.showSections ?? isBusinessSheet;

  /*
   * The wording that will actually be frozen onto the record. The two sheets
   * state different terms — the domestic one promises a 10-year inverter
   * warranty, the project sheet a 5-year one plus a 5-year AMC — so this has to
   * follow the sheet rather than the company default, or the preview would show
   * one set while the server stores the other.
   */
  const fixedTerms = typeOption?.terms?.length ? typeOption.terms : defaults?.terms ?? [];
  const fixedPaymentTerms = typeOption?.paymentTerms?.length
    ? typeOption.paymentTerms
    : defaults?.paymentTerms ?? [];

  const [form, setForm] = useState<FormState>(() =>
    initial
      ? fromQuotation(initial)
      : {
          ...emptyForm(panelWpDefault, validityDefault),
          // The domestic sheet quotes an all-in figure; the business sheet quotes
          // before tax and states the rate in its terms.
          amountIncludesGST: typeOption?.amountIncludesGST ?? !isBusinessSheet,
        }
  );
  const [items, setItems] = useState<QuotationItem[]>(() => initial?.items ?? []);
  const [panelQtyTouched, setPanelQtyTouched] = useState(Boolean(initial?.panelQty));

  // -------------------------------------------------------------- number field
  /** What the admin has in the number box. Only used on create. */
  const [numberInput, setNumberInput] = useState('');
  const [numberCheck, setNumberCheck] = useState<QuotationNumberCheck | null>(null);
  const [checkingNumber, setCheckingNumber] = useState(false);
  /**
   * Guards the suggestion from overwriting a number the admin typed: the
   * "next number" preview refetches whenever the scheme or the date changes, and
   * it must not silently replace a hand-typed number when it does.
   */
  const [numberTouched, setNumberTouched] = useState(false);

  const suggestedNumber = nextNumber?.quotationNo ?? '';
  const numberIsTyped = numberTouched && numberInput.trim() !== suggestedNumber;

  // Take the suggestion until the admin types over it.
  useEffect(() => {
    if (mode !== 'create') return;
    if (numberTouched) return;
    setNumberInput(suggestedNumber);
    setNumberCheck(null);
  }, [mode, numberTouched, suggestedNumber]);

  /**
   * Check the typed number as it is edited, once typing pauses.
   *
   * The format is judged here first (no request for something that cannot be a
   * number), then the server is asked whether it is free. `issueDate` travels
   * with the request because the number's financial year has to match the date
   * the quotation is issued on.
   */
  useEffect(() => {
    if (mode !== 'create' || !numberIsTyped) return;
    if (!onCheckNumber) return;

    const candidate = numberInput.trim();
    if (!candidate) {
      setNumberCheck(null);
      setCheckingNumber(false);
      return;
    }

    let cancelled = false;
    setCheckingNumber(true);

    const timer = setTimeout(() => {
      void onCheckNumber({ quotationNo: candidate, issueDate: form.issueDate || undefined })
        .then((result) => {
          if (!cancelled) setNumberCheck(result);
        })
        .finally(() => {
          if (!cancelled) setCheckingNumber(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, numberIsTyped, numberInput, form.issueDate, onCheckNumber]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Suggested panel count: ceil(kW * 1000 * 1.2 / Wp) — 3 kW -> 6 x 610 Wp. */
  const suggestedPanelQty = useMemo(() => {
    const kW = Number(form.systemSizeKW);
    const wp = Number(form.panelWp) || panelWpDefault;
    if (!Number.isFinite(kW) || kW <= 0 || wp <= 0) return '';
    return String(Math.max(1, Math.ceil((kW * 1000 * sizingFactor) / wp)));
  }, [form.systemSizeKW, form.panelWp, panelWpDefault, sizingFactor]);

  const effectivePanelQty = panelQtyTouched && form.panelQty ? form.panelQty : suggestedPanelQty;

  const sumOfLines = useMemo(() => {
    const values = items
      .map((item) => (item.amount === null || item.amount === undefined ? null : Number(item.amount)))
      .filter((value): value is number => Number.isFinite(value));
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
  }, [items]);

  const validationMessage = useMemo(
    () => validate(form, items, itemLimit, isBusinessSheet),
    [form, items, itemLimit, isBusinessSheet]
  );

  const numberLabel = mode === 'edit' ? initial?.quotationNo ?? '' : nextNumber?.quotationNo ?? 'Assigning…';

  /**
   * The verdict on the typed number: the local format rule first, then the
   * server's answer — but only while that answer is about the number currently
   * in the box. An answer from an earlier keystroke would accuse the wrong
   * number, so it is ignored until it matches what is typed now.
   */
  const numberError = useMemo(() => {
    if (mode !== 'create' || !numberIsTyped) return null;

    const candidate = numberInput.trim();
    if (!candidate) return 'A quotation number is required.';
    if (!QUOTATION_NUMBER_PATTERN.test(candidate)) {
      return 'Use the form SE/PMSGY/2026-27/45 — prefix / scheme / financial year / serial.';
    }

    if (numberCheck && normaliseNumber(numberCheck.quotationNo) === normaliseNumber(candidate)) {
      return numberCheck.available ? null : numberCheck.message;
    }

    return null;
  }, [mode, numberIsTyped, numberInput, numberCheck]);

  const numberConfirmed =
    numberIsTyped &&
    Boolean(numberCheck?.available) &&
    normaliseNumber(numberCheck?.quotationNo ?? '') === normaliseNumber(numberInput.trim());

  const handleSubmit = () => {
    if (validationMessage || numberError) return;

    const payload: QuotationPayload = {
      customerName: form.customerName.trim(),
      consumerId: form.consumerId.trim(),
      phoneNo: form.phoneNo.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      shipTo: {
        name: form.shipToName.trim(),
        addressLines: form.shipToAddress
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        phone: form.shipToPhone.trim(),
      },
      district: form.district.trim(),
      pincode: form.pincode.trim(),
      /*
       * Blank goes as null, not 0. A business sheet may genuinely have no single
       * kW figure, and Number('') is 0, which the server rejects for being below
       * its 0.1 kW floor.
       */
      systemSizeKW: form.systemSizeKW ? Number(form.systemSizeKW) : null,
      panelWp: form.panelWp ? Number(form.panelWp) : null,
      panelQty: effectivePanelQty ? Number(effectivePanelQty) : null,
      panelBrand: form.panelBrand.trim(),
      inverterCapacityKW: form.inverterCapacityKW
        ? Number(form.inverterCapacityKW)
        : form.systemSizeKW
          ? Number(form.systemSizeKW)
          : null,
      inverterBrand: form.inverterBrand.trim(),
      structureType: form.structureType,
      issueDate: form.issueDate || undefined,
      validityDays: form.validityDays ? Number(form.validityDays) : undefined,
      amount: form.amount === '' ? (sumOfLines ?? null) : Number(form.amount),
      amountIncludesGST: form.amountIncludesGST,
      status: form.status,
      notes: form.notes.trim(),
      items: items.map((item, index) => ({ ...item, order: index + 1 })),
      // terms / paymentTerms are fixed company-wide and are never sent.
    };

    // The scheme is embedded in the number, so it may only be chosen on create.
    if (mode === 'create') payload.schemeCode = form.schemeCode;

    // Which sheet to issue. Create only: the terms and the printed layout follow
    // from it, and the server re-copies them when it changes on an edit.
    if (mode === 'create') payload.quotationType = quotationType;

    /*
     * Only sent when the admin actually typed one. Sending the untouched
     * suggestion would claim that exact number instead of letting the server
     * allocate the next free one, and two admins saving at the same moment would
     * then collide where today they do not.
     */
    if (mode === 'create' && numberIsTyped) payload.quotationNo = numberInput.trim();

    void onSubmit(payload);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      {/* Number */}
      <div className="surface-card px-4 py-3">
        {mode === 'edit' ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Quotation number</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">{numberLabel}</p>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">
              <p>The number cannot be changed.</p>
              <p>{initial?.financialYear}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label className="text-xs uppercase tracking-wide text-[var(--muted)]" htmlFor="quotation-no">
                Quotation number
              </label>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <input
                  id="quotation-no"
                  className="form-input w-full max-w-[280px] font-medium tracking-wide"
                  value={numberInput}
                  placeholder={suggestedNumber || 'SE/PMSGY/2026-27/45'}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => {
                    setNumberTouched(true);
                    setNumberInput(event.target.value.toUpperCase());
                  }}
                  aria-invalid={Boolean(numberError)}
                  aria-describedby="quotation-no-status"
                />

                {numberIsTyped && suggestedNumber && (
                  <button
                    type="button"
                    className="neutral-button text-xs"
                    onClick={() => {
                      setNumberTouched(false);
                      setNumberInput(suggestedNumber);
                      setNumberCheck(null);
                    }}
                    title={`Use the next free number, ${suggestedNumber}`}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Use next free number
                  </button>
                )}
              </div>

              {/*
                One line that always says where the number stands: checking, a
                named problem, confirmed free, or the neutral explanation. The
                alert role is only present when there is something to correct, so
                a screen reader is not interrupted by the routine states.
              */}
              <p
                id="quotation-no-status"
                role={numberError ? 'alert' : undefined}
                className="mt-1.5 text-xs"
              >
                {checkingNumber ? (
                  <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking {numberInput.trim()}…
                  </span>
                ) : numberError ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--error)]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {numberError}
                  </span>
                ) : numberConfirmed ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--success)]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {numberInput.trim()} is free — it will be used exactly as typed.
                  </span>
                ) : (
                  <span className="text-[var(--muted-soft)]">
                    {numberIsTyped
                      ? 'Checked against the register as you type.'
                      : 'Assigned automatically on save — or type the number the office has already issued.'}
                  </span>
                )}
              </p>
            </div>

            <div className="text-right text-xs text-[var(--muted)]">
              <p>Next free: {suggestedNumber || '—'}</p>
              <p>{nextNumber ? `${nextNumber.financialYear} · ${nextNumber.schemeCode}` : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Customer</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Consumer name *">
            <input
              className="form-input"
              value={form.customerName}
              onChange={(event) => set('customerName', event.target.value)}
              placeholder="Souvik Ghosh"
              required
            />
          </Field>
          <Field label="Consumer id">
            <input
              className="form-input"
              value={form.consumerId}
              onChange={(event) => set('consumerId', event.target.value.replace(/[\s-]/g, ''))}
              placeholder="502178060"
              inputMode="numeric"
            />
          </Field>
          <Field label="Mobile number">
            <input
              className="form-input"
              value={form.phoneNo}
              onChange={(event) => set('phoneNo', event.target.value.replace(/[\s-]/g, ''))}
              placeholder="9432665126"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
          <Field label="District">
            <input
              className="form-input"
              value={form.district}
              onChange={(event) => set('district', event.target.value)}
              placeholder="Hooghly"
            />
          </Field>
          <Field label="Address line 1">
            <input
              className="form-input"
              value={form.addressLine1}
              onChange={(event) => set('addressLine1', event.target.value)}
              placeholder="Birpur, Gurap"
            />
          </Field>
          <Field label="Address line 2">
            <input
              className="form-input"
              value={form.addressLine2}
              onChange={(event) => set('addressLine2', event.target.value)}
              placeholder="Near the temple"
            />
          </Field>
          <Field label="Pin code">
            <input
              className="form-input"
              value={form.pincode}
              onChange={(event) => set('pincode', event.target.value)}
              placeholder="712303"
              inputMode="numeric"
              maxLength={6}
            />
          </Field>
          {/*
            The business sheet prints a delivery block beside Bill To. The
            domestic sheet has the columns but they are always left blank, so the
            fields are not shown there.
          */}
          {isBusinessSheet && (
            <Field label="Ship to — name">
              <input
                className="form-input"
                value={form.shipToName}
                onChange={(event) => set('shipToName', event.target.value)}
                placeholder="Consignee / site"
              />
            </Field>
          )}
          {isBusinessSheet && (
            <Field label="Ship to — address">
              <textarea
                className="form-input"
                rows={3}
                value={form.shipToAddress}
                onChange={(event) => set('shipToAddress', event.target.value)}
                placeholder={'One line per row\nSite address\nDistrict, PIN'}
              />
            </Field>
          )}
          {isBusinessSheet && (
            <Field label="Ship to — phone">
              <input
                className="form-input"
                value={form.shipToPhone}
                onChange={(event) => set('shipToPhone', event.target.value)}
                placeholder="9432665126"
                inputMode="numeric"
                maxLength={10}
              />
            </Field>
          )}
          <Field label="Scheme">
            <select
              className="form-input"
              value={form.schemeCode}
              disabled={mode === 'edit'}
              onChange={(event) => {
                set('schemeCode', event.target.value);
                onSchemeChange?.(event.target.value);
              }}
            >
              {schemeList.map((scheme) => (
                <option key={scheme.code} value={scheme.code}>
                  {scheme.code}
                  {scheme.label ? ` — ${scheme.label}` : ''}
                </option>
              ))}
            </select>
            {mode === 'edit' && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                The scheme is part of the number, so it cannot change after issue.
              </p>
            )}
          </Field>
        </div>
      </section>

      {/* System */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">System</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="System size (kW) *">
            <input
              className="form-input"
              type="number"
              min={0.1}
              max={100}
              step="any"
              value={form.systemSizeKW}
              onChange={(event) => set('systemSizeKW', event.target.value)}
              placeholder="3"
              required
            />
          </Field>
          <Field label="Panel watt-peak (Wp)">
            <input
              className="form-input"
              type="number"
              min={100}
              max={1000}
              step="any"
              value={form.panelWp}
              onChange={(event) => set('panelWp', event.target.value)}
              placeholder="610"
            />
          </Field>
          <Field label="Panels">
            <input
              className="form-input"
              type="number"
              min={1}
              value={panelQtyTouched ? form.panelQty : suggestedPanelQty}
              onChange={(event) => {
                setPanelQtyTouched(true);
                set('panelQty', event.target.value);
              }}
              placeholder="6"
            />
            {!panelQtyTouched && suggestedPanelQty && (
              <p className="mt-1 text-xs text-[var(--muted)]">Suggested for {form.systemSizeKW} kW</p>
            )}
          </Field>
          <Field label="Panel brand">
            <input
              className="form-input"
              value={form.panelBrand}
              onChange={(event) => set('panelBrand', event.target.value)}
              placeholder="Waaree/Adani"
            />
          </Field>
          <Field label="Inverter capacity (kW)">
            <input
              className="form-input"
              type="number"
              min={0.1}
              max={100}
              step="any"
              value={form.inverterCapacityKW}
              onChange={(event) => set('inverterCapacityKW', event.target.value)}
              placeholder="3"
            />
          </Field>
          <Field label="Inverter brand">
            <input
              className="form-input"
              value={form.inverterBrand}
              onChange={(event) => set('inverterBrand', event.target.value)}
              placeholder="Deye/any"
            />
          </Field>
          <Field label="Mounting structure" className="sm:col-span-3">
            <select
              className="form-input"
              value={form.structureType}
              onChange={(event) => set('structureType', event.target.value as StructureType)}
            >
              {STRUCTURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* BOQ */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Bill of quantities</h3>
        <p className="text-xs text-[var(--muted)]">
          {isBusinessSheet
            ? 'Business sheets have no fixed pattern — add a line for every item. Lines sharing a section heading print under one heading with their own sub-total.'
            : 'Leave this empty to start from the standard 8-line template on save.'}
        </p>
        <BOQItemsEditor
          items={items}
          onChange={setItems}
          limit={itemLimit}
          showSpecification={showSpecificationColumn}
          showSections={showSections}
          showAmountColumn={isBusinessSheet}
          hasStandardTemplate={!isBusinessSheet}
          disabled={submitting}
        />
      </section>

      {/* Money, dates, status */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Amount, dates and status</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Total amount (₹)">
            <input
              className="form-input"
              type="number"
              min={0}
              step="any"
              value={form.amount}
              onChange={(event) => set('amount', event.target.value)}
              placeholder={sumOfLines !== null ? String(sumOfLines) : '195000'}
            />
            {sumOfLines !== null && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Sum of BOQ lines: {formatINR(sumOfLines)}
                {form.amount === '' ? ' (will be used)' : ''}
              </p>
            )}
            {form.amount !== '' && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                On the document: {formatDocumentAmount(Number(form.amount))}
              </p>
            )}
          </Field>
          <Field label="Quotation date *">
            <input
              className="form-input"
              type="date"
              value={form.issueDate}
              onChange={(event) => {
                set('issueDate', event.target.value);
                onIssueDateChange?.(event.target.value);
              }}
              required
            />
          </Field>
          <Field label="Valid for (days)">
            <input
              className="form-input"
              type="number"
              min={1}
              max={365}
              value={form.validityDays}
              onChange={(event) => set('validityDays', event.target.value)}
              placeholder="7"
            />
          </Field>
          <Field label="Status">
            <select
              className="form-input"
              value={form.status}
              onChange={(event) => set('status', event.target.value as QuotationStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm text-[var(--secondary)]">
            <input
              type="checkbox"
              checked={form.amountIncludesGST}
              onChange={(event) => set('amountIncludesGST', event.target.checked)}
            />
            Amount includes GST
          </label>
        </div>
      </section>

      {/* Fixed wording */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          Terms and payment terms
          <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-normal text-[var(--muted)]">
            fixed
          </span>
        </h3>
        <p className="text-xs text-[var(--muted)]">
          The same on every quotation — change them once in the company settings and every document follows.
        </p>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Terms &amp; condition
            </p>
            {fixedTerms.length ? (
              <ol className="mt-2 space-y-1 text-xs text-[var(--secondary)]">
                {fixedTerms.map((term, index) => (
                  <li key={`fixed-term-${index}`}>{term.text}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">Applied from the company settings on save.</p>
            )}
          </div>

          <div className="rounded-lg bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Payment terms</p>
            {fixedPaymentTerms.length ? (
              <ul className="mt-2 space-y-1 text-xs text-[var(--secondary)]">
                {fixedPaymentTerms.map((term, index) => (
                  <li key={`fixed-payment-${index}`}>{term.text}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">Applied from the company settings on save.</p>
            )}
          </div>
        </div>

        <Field label="Internal notes">
          <textarea
            className="form-input min-h-[60px]"
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            placeholder="Not printed on the quotation"
          />
        </Field>
      </section>

      {validationMessage && (
        <p role="alert" className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--error)]">
          {validationMessage}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="submit" disabled={submitting || Boolean(validationMessage)} className="brand-button">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create quotation' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`.trim()}>
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

export default QuotationForm;
