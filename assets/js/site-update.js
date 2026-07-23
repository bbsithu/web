(function () {
  "use strict";

  var script = document.querySelector("script[data-site-version]");
  var notification = document.querySelector("[data-site-update]");
  if (!script || !notification) return;

  var currentVersion = script.dataset.siteVersion;
  var registration;
  var refreshing = false;

  function showNotification() {
    notification.hidden = false;
  }

  function checkPublishedVersion() {
    var separator = script.dataset.versionUrl.includes("?") ? "&" : "?";
    var url = script.dataset.versionUrl + separator + "cache-bust=" + Date.now();

    fetch(url, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("Version check failed");
        return response.json();
      })
      .then(function (payload) {
        if (payload.version && payload.version !== currentVersion) showNotification();
      })
      .catch(function () {
        // A version check must never prevent the site from loading.
      });
  }

  notification.querySelector("[data-site-update-refresh]").addEventListener("click", function () {
    if (registration && registration.waiting) {
      registration.waiting.postMessage("SKIP_WAITING");
      return;
    }

    fetch(window.location.href, { cache: "reload" }).finally(function () {
      window.location.reload();
    });
  });

  notification.querySelector("[data-site-update-dismiss]").addEventListener("click", function () {
    notification.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(script.dataset.workerUrl, { updateViaCache: "none" }).then(function (workerRegistration) {
      registration = workerRegistration;

      if (registration.waiting && navigator.serviceWorker.controller) showNotification();

      registration.addEventListener("updatefound", function () {
        var installing = registration.installing;
        if (!installing) return;

        installing.addEventListener("statechange", function () {
          if (registration.waiting && navigator.serviceWorker.controller) showNotification();
        });
      });

      registration.update();
    }).catch(function () {
      // Version polling remains available when registration is unsupported or blocked.
    });

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  checkPublishedVersion();
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") checkPublishedVersion();
  });
}());
