'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { TextField } from './wizard/WizardFields';
import { CreditCheckPanel } from './CreditCheckPanel';
import { emptyCreditCheckValue, numberOrNull, type CreditCheckValue } from './wizard/wizardTypes';

interface CreditPreCheckProps {
  open: boolean;
  onClose: () => void;
  /**
   * The page's existing new-application action. Deliberately not tied to the
   * verdict — a `review` or `fail` is only a notice.
   */
  onContinue: () => void;
}

/**
 * The credit pre-check run before an application exists. It closes onto the
 * normal new-application flow; the verdict never enables or disables that.
 */
export function CreditPreCheck({ open, onClose, onContinue }: CreditPreCheckProps) {
  const [amount, setAmount] = useState('');
  const [value, setValue] = useState<CreditCheckValue>(() => emptyCreditCheckValue());

  const reset = () => {
    setAmount('');
    setValue(emptyCreditCheckValue());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleContinue = () => {
    reset();
    onContinue();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Credit pre-check"
      eyebrow="Before you start"
      size="lg"
      footer={
        <>
          <button type="button" className="neutral-button" onClick={handleClose}>
            Close
          </button>
          <button type="button" className="brand-button" onClick={handleContinue}>
            Continue to application
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm leading-6 text-[var(--muted)]">
          A quick read on the consumer&apos;s credit before you file. Nothing here is saved and nothing is required —
          you can carry on to the application either way.
        </p>

        <TextField
          id="pre-check-amount"
          label="Project cost (₹)"
          value={amount}
          onValueChange={setAmount}
          placeholder="e.g. 145000"
          numeric
          hint="Above ₹2 lakh the banks apply their credit-scored rules, so the verdict changes with the amount."
        />

        <CreditCheckPanel value={value} onChange={setValue} amount={numberOrNull(amount)} />
      </div>
    </Modal>
  );
}

export default CreditPreCheck;
