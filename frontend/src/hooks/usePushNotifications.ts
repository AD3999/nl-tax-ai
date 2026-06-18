import { useCallback, useEffect, useState } from "react";
import { apiBase, authHeader } from "../api/client";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

// Safari and some Android browsers reject a bare base64url string as applicationServerKey.
// All browsers accept a Uint8Array, so we always convert.
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [subscribed, setSubscribed] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  useEffect(() => {
    if (!isSupported) { setPermission("unsupported"); return; }
    setPermission(Notification.permission as PushPermission);
    // Restore subscribed state across page loads
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => { if (sub) setSubscribed(true); })
      .catch(() => null);
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    // Register service worker if not already active
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Fetch VAPID public key
    let vapidPublicKey = "";
    try {
      const res = await fetch(`${apiBase}/users/push/vapid-key/`);
      const json = await res.json() as { public_key: string };
      vapidPublicKey = json.public_key;
    } catch { return false; }

    if (!vapidPublicKey) return false;

    // Request notification permission
    const perm = await Notification.requestPermission();
    setPermission(perm as PushPermission);
    if (perm !== "granted") return false;

    // Subscribe to push service
    let sub: PushSubscription;
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    } catch (err) {
      console.error("pushManager.subscribe() failed:", err);
      return false;
    }

    // Send subscription to backend
    const subJson = sub.toJSON();
    const keys = subJson.keys as { p256dh: string; auth: string };
    try {
      const res = await fetch(`${apiBase}/users/push/subscribe/`, {
        method:  "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body:    JSON.stringify({
          endpoint: sub.endpoint,
          p256dh:   keys.p256dh,
          auth:     keys.auth,
        }),
      });
      if (!res.ok) {
        console.error("Push subscribe failed:", res.status, await res.text());
        return false;
      }
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await fetch(`${apiBase}/users/push/subscribe/`, {
        method:  "DELETE",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      setSubscribed(false);
    } catch { /* silent */ }
  }, [isSupported]);

  return { permission, subscribed, isSupported, subscribe, unsubscribe };
}
