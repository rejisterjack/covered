const CACHE = "covered-v7";
const PRECACHE = [
  "/",
  "/install",
  "/app",
  "/leaderboard",
  "/embed/leaderboard",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/api/bills?tab=new",
  "/api/bills?tab=hot",
  "/api/bills?tab=covered",
  "/api/leaderboard?period=all",
  "/api/leaderboard?period=month",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // One missed URL must not drop the rest of the shell.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isApiFeed =
    url.pathname.startsWith("/api/bills") ||
    url.pathname.startsWith("/api/leaderboard");
  const isNavigation = request.mode === "navigate";

  if (!isApiFeed && !isNavigation && !PRECACHE.includes(url.pathname)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, network.clone());
        return network;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (isNavigation) {
          const app = await caches.match("/app");
          if (app) return app;
          const home = await caches.match("/");
          if (home) return home;
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Covered", body: "You have an update", url: "/app" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    // ignore
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url },
      icon: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app";
  event.waitUntil(clients.openWindow(url));
});
