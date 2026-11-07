"use client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

export function pushSupport() {
  if (typeof window === "undefined") return "unsupported" as const;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported" as const;
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "unconfigured" as const;

  return "ready" as const;
}

export async function currentPushSubscription() {
  if (pushSupport() !== "ready") return null;
  const reg = await navigator.serviceWorker.ready;

  return reg.pushManager.getSubscription();
}

export async function enablePush() {
  const support = pushSupport();

  if (support === "unsupported") throw new Error("This browser cannot do push");
  if (support === "unconfigured") {
    throw new Error("Push is not configured on this server");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") throw new Error("Notifications were blocked");

  const reg = await navigator.serviceWorker.ready;
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));
  const json = sub.toJSON();

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Could not read the push subscription");
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });

  if (!res.ok) throw new Error("Could not save the push subscription");

  return true;
}
