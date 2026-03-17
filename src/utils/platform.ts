// platform.ts — runtime detection of device type and capabilities.

/** True if the primary input is a touchscreen (phone/tablet). */
export const isTouchDevice: boolean =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

/** True if the device is running iOS (iPhone/iPad). */
export const isIOS: boolean =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)

/** True if running in a standalone PWA (added to home screen). */
export const isPWA: boolean =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

/**
 * Request the Fullscreen API on an element.
 * Falls back gracefully if not supported (e.g., some iOS Safari versions).
 */
export async function requestFullscreen(element: Element = document.documentElement): Promise<void> {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen()
    } else if ((element as Element & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
      await (element as Element & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
    }
  } catch {
    // Fullscreen may fail if not triggered by a user gesture — silently ignore.
  }
}

/** Exit fullscreen. */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  } catch {
    // Silently ignore.
  }
}

/** True if the document is currently in fullscreen mode. */
export function isFullscreen(): boolean {
  return !!document.fullscreenElement
}
