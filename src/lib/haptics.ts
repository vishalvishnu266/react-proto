import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Thin wrapper around @capacitor/haptics that safely no-ops on platforms
 * where the plugin isn't available (e.g. plain web without the vibration
 * fallback). Import these helpers instead of using the plugin directly so
 * UI code doesn't have to worry about platform checks.
 */

const isAvailable = (): boolean =>
  Capacitor.isPluginAvailable('Haptics');

export async function impact(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Silently ignore — haptics are a progressive enhancement.
  }
}

export const impactLight = () => impact(ImpactStyle.Light);
export const impactMedium = () => impact(ImpactStyle.Medium);
export const impactHeavy = () => impact(ImpactStyle.Heavy);

export async function notify(
  type: NotificationType = NotificationType.Success,
): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Haptics.notification({ type });
  } catch {
    /* no-op */
  }
}

export async function vibrate(durationMs = 300): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Haptics.vibrate({ duration: durationMs });
  } catch {
    /* no-op */
  }
}

export async function selectionStart(): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Haptics.selectionStart();
  } catch {
    /* no-op */
  }
}

export async function selectionChanged(): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Haptics.selectionChanged();
  } catch {
    /* no-op */
  }
}

export async function selectionEnd(): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Haptics.selectionEnd();
  } catch {
    /* no-op */
  }
}

export { ImpactStyle, NotificationType };
