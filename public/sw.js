self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch (error) {
    console.error("Invalid expense reminder push payload", error);
    return;
  }

  if (
    !payload ||
    typeof payload.title !== "string" ||
    typeof payload.body !== "string" ||
    typeof payload.url !== "string"
  ) {
    return;
  }

  let target;
  try {
    target = new URL(payload.url, self.location.origin);
  } catch (error) {
    console.error("Invalid expense reminder target", error);
    return;
  }
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: target.href },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url;
  if (typeof targetUrl !== "string") return;

  let target;
  try {
    target = new URL(targetUrl, self.location.origin);
  } catch (error) {
    console.error("Invalid expense reminder click target", error);
    return;
  }
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => client.url === target.href);
        if (existing) return existing.focus();
        return self.clients.openWindow(target.href);
      }),
  );
});
