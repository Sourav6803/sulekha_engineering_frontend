import QRCode from 'qrcode';

/**
 * Campaign links and QR codes for printed banners.
 *
 * A scan has to be attributable, otherwise a poster cannot be told apart from a
 * walk-in. Every code therefore carries `utm_source` (the campaign tag recorded
 * on the banner) and `utm_medium=qr`, and the enquiry form posts them with the
 * lead — the office sees "banner_qr / puja-2026" instead of a bare phone number.
 */

export const buildCampaignUrl = (origin: string, campaign: string, path = '/enquiry'): string => {
  const base = origin.replace(/\/$/, '');
  const tag = campaign.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  const params = new URLSearchParams({
    utm_source: tag || 'banner',
    utm_medium: 'qr',
    utm_campaign: tag || 'banner',
  });
  return `${base}${path}?${params.toString()}`;
};

export type QrOptions = {
  size?: number;
  margin?: number;
  dark?: string;
  light?: string;
};

/** A data URL suitable for an <img> and for a right-click save. */
export const makeQrDataUrl = (text: string, options: QrOptions = {}): Promise<string> =>
  QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: options.margin ?? 2,
    width: options.size ?? 512,
    color: { dark: options.dark ?? '#0F2A1B', light: options.light ?? '#FFFFFF' },
  });

/** Trigger a download of the generated PNG without a server round trip. */
export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
