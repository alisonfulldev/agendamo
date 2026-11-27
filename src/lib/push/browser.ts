/** Browser helpers for web push (customer reminders). Client-side only. */

export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function isIos(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/** Opened from the home screen icon (installed app). */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Asks the permission and returns the device's subscription. An existing one (the owner's panel
 * on the same phone, or an earlier booking) is reused, never removed.
 */
export async function subscribeDevice(
  vapidPublicKey: string,
): Promise<PushSubscription | "denied" | "dismissed"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "dismissed";
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  const options = { userVisibleOnly: true, applicationServerKey: base64UrlToBytes(vapidPublicKey) };
  try {
    return await registration.pushManager.subscribe(options);
  } catch (first) {
    // AbortError: the phone's push service did not answer; one more try usually works.
    if (!(first instanceof Error) || first.name !== "AbortError") throw first;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return registration.pushManager.subscribe(options);
  }
}
