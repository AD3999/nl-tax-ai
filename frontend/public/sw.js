/* TaxWijs Service Worker — handles Web Push notifications */

self.addEventListener("push", (event) => {
  let data = { title: "TaxWijs", body: "You have a new notification.", url: "/" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    data.body = event.data ? event.data.text() : data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  "/icon-192.png",
      badge: "/icon-72.png",
      data:  { url: data.url ?? "/" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const match = wins.find((w) => w.url.includes(targetUrl));
      if (match) return match.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
