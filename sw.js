var BUILD_VERSION = "1784803973";

self.addEventListener("install", function () {
  // A changed build version creates a waiting worker and lets the page offer the update.
  void BUILD_VERSION;
});

self.addEventListener("message", function (event) {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
