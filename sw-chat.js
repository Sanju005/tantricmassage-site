self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data.json(); } catch (e) { /* ignore */ }
  event.waitUntil(
    self.registration.showNotification(data.title || "New message", {
      body: data.body || "",
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      tag: data.tag || "chat",
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var target = new URL(event.notification.data && event.notification.data.url || "/", self.location.origin);
  if (target.origin !== self.location.origin) target = new URL("/", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (new URL(c.url).pathname === target.pathname && "focus" in c) {
          return c.focus().then(function () { return c.navigate(target.href); });
        }
      }
      return self.clients.openWindow(target.href);
    })
  );
});
