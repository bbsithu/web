(function () {
  "use strict";

  var panel = document.querySelector("[data-series]");
  if (!panel) return;

  var sessions = Array.prototype.slice.call(panel.querySelectorAll("[data-series-session]"));
  var progress = panel.querySelector("[data-series-progress]");
  var fill = panel.querySelector("[data-series-progress-fill]");
  var status = panel.querySelector("[data-series-status]");
  var today = new Date();
  var localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  var nextIndex = sessions.findIndex(function (session) { return session.dataset.sessionDate >= localDate; });
  var completed = nextIndex === -1 ? sessions.length : nextIndex;

  sessions.forEach(function (session, index) {
    session.classList.toggle("is-complete", index < completed);
    session.classList.toggle("is-next", index === nextIndex);
  });

  progress.setAttribute("aria-valuenow", String(completed));
  fill.style.setProperty("--session-count", String(sessions.length));
  sessions.forEach(function (_, index) {
    var block = document.createElement("span");
    block.className = "series-progress-block";
    block.style.setProperty("--block-index", String(index));
    if (index < completed) block.classList.add("is-filled");
    if (index === (nextIndex === -1 ? Math.max(completed - 1, 0) : nextIndex)) block.classList.add("is-cursor");
    fill.appendChild(block);
  });
  panel.querySelector("[data-series-progress-text]").textContent = `${completed} / ${sessions.length} alkalom teljesítve`;

  if (nextIndex === -1) {
    status.textContent = `A sorozat lezárult: ${sessions.length}/${sessions.length} alkalom.`;
  } else {
    var next = sessions[nextIndex];
    status.textContent = `${nextIndex + 1}/${sessions.length}. alkalom: ${next.querySelector("time").textContent}.`;
  }

  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-session-trigger]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-session-panel]"));
  if (!triggers.length || !panels.length) return;

  function selectSession(id) {
    triggers.forEach(function (trigger) {
      var selected = trigger.dataset.sessionTrigger === id;
      trigger.setAttribute("aria-selected", String(selected));
      trigger.tabIndex = selected ? 0 : -1;
      trigger.classList.toggle("is-selected", selected);
    });
    panels.forEach(function (sessionPanel) {
      sessionPanel.hidden = sessionPanel.dataset.sessionPanel !== id;
    });
  }

  function updateHomework() {
    panels.forEach(function (sessionPanel) {
      var homework = sessionPanel.querySelector("[data-session-homework]");
      if (homework) homework.hidden = sessionPanel.dataset.sessionDate > localDate;
    });
  }

  function selectedIdFromHash() {
    var id = window.location.hash.slice(1).replace(/^session-/, "");
    if (triggers.some(function (trigger) { return trigger.dataset.sessionTrigger === id; })) return id;
    var defaultIndex = nextIndex === -1 ? triggers.length - 1 : nextIndex;
    return triggers[Math.min(defaultIndex, triggers.length - 1)].dataset.sessionTrigger;
  }

  function selectFromLocation() {
    selectSession(selectedIdFromHash());
  }

  triggers.forEach(function (trigger, index) {
    trigger.addEventListener("click", function () {
      var id = trigger.dataset.sessionTrigger;
      selectSession(id);
      window.history.pushState(null, "", `#session-${id}`);
    });
    trigger.addEventListener("keydown", function (event) {
      var targetIndex;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") targetIndex = (index + 1) % triggers.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") targetIndex = (index - 1 + triggers.length) % triggers.length;
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = triggers.length - 1;
      if (targetIndex === undefined) return;
      event.preventDefault();
      triggers[targetIndex].focus();
      triggers[targetIndex].click();
    });
  });

  window.addEventListener("hashchange", selectFromLocation);
  window.addEventListener("popstate", selectFromLocation);
  updateHomework();
  selectFromLocation();
}());
