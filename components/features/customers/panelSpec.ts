/**
 * The module this vendor fits, and the arithmetic that follows from it.
 *
 * 550 Wp is the rating carried by the master BOM — the same figure the
 * quotations are built from — so panel counts derived here agree with the
 * counts on the paperwork. If the BOM ever switches to a different module,
 * this is the one place to change.
 *
 * Lives on its own because two screens now need it: the serial-number card,
 * which sizes its empty rows from it, and the customer overview, which shows
 * the expected panel count next to the serials actually recorded. Two copies
 * of a constant like this is how a UI ends up telling an installer to expect
 * six panels on one card and four on another.
 */

/** Watts-peak of a single module. */
export const PANEL_WATT_PEAK = 550;

/** The same module rating in kW, which is the unit system sizes arrive in. */
export const PANEL_KILOWATT_PEAK = PANEL_WATT_PEAK / 1000;

/**
 * How many modules a system of this size takes, rounded up.
 *
 * Rounded up on purpose: the array has to be able to hold every panel on the
 * roof, and a half panel is still a panel. Returns 0 for a size that is
 * missing or nonsensical so callers can skip rendering rather than show
 * "about NaN panels".
 */
export function suggestPanelCount(systemSizeKW: number | undefined | null): number {
  if (typeof systemSizeKW !== 'number' || !Number.isFinite(systemSizeKW) || systemSizeKW <= 0) {
    return 0;
  }
  return Math.ceil(systemSizeKW / PANEL_KILOWATT_PEAK);
}
