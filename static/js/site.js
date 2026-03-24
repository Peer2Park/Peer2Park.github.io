const scenarioData = {
  campus: {
    label: "Campus turnover",
    title: "A lecture is ending and the lot is starting to clear.",
    copy:
      "A space was just seen opening near the engineering side of campus. The useful question is not whether parking exists somewhere. It is whether this opening is still worth the walk and the turn.",
    age: "42 sec",
    distance: "3 min",
    window: "7 min",
    overlayPrimary: "Campus turnover",
    overlaySecondary: "42 sec old · engineering side",
    photo: "static/media/photos/parking-grid.jpg",
    photoAlt: "An aerial view of a parking lot",
    photoLabel: "Street view",
    photoTitle: "Turnover starts when people move all at once.",
    photoCopy:
      "Class changes and short errands create the kind of brief parking windows that stale maps miss.",
    accent: "#69d9ff",
  },
  lunch: {
    label: "Downtown lunch",
    title: "One curb lane can reset several times in the same lunch hour.",
    copy:
      "Delivery stops, quick errands, and short meetings create rapid curb churn. A driver deciding whether to turn now needs a recent signal more than a perfect long-range prediction.",
    age: "28 sec",
    distance: "1 block",
    window: "5 min",
    overlayPrimary: "Downtown lunch churn",
    overlaySecondary: "28 sec old · curb lane near offices",
    photo: "static/media/photos/downtown-curb.jpg",
    photoAlt: "Cars parked along a downtown curb",
    photoLabel: "Street view",
    photoTitle: "Lunch traffic opens spaces for only a moment.",
    photoCopy:
      "When curb demand is high, the useful signal is often the newest one, not the most polished one.",
    accent: "#ffb36d",
  },
  evening: {
    label: "Evening exit",
    title: "A short opening appears as drivers leave at the same time.",
    copy:
      "After-work traffic and event exits can create brief opportunities that disappear before a conventional parking app catches up. The decision window is narrow, which is where freshness matters most.",
    age: "51 sec",
    distance: "2 blocks",
    window: "6 min",
    overlayPrimary: "Evening exit flow",
    overlaySecondary: "51 sec old · curb release near venue",
    photo: "static/media/photos/twilight-curb.jpg",
    photoAlt: "A city street at dusk with parked cars",
    photoLabel: "Street view",
    photoTitle: "Evening traffic changes the curb in waves.",
    photoCopy:
      "The point is to help someone decide whether a recent sighting still has enough life left to matter.",
    accent: "#8ea6ff",
  },
};

function setupScenarioSwitcher() {
  const root = document.querySelector("[data-scenario-root]");
  if (!root) return;

  const buttons = [...root.querySelectorAll("[data-scenario-button]")];
  const label = root.querySelector("[data-scenario-label]");
  const title = root.querySelector("[data-scenario-title]");
  const copy = root.querySelector("[data-scenario-copy]");
  const age = root.querySelector("[data-scenario-age]");
  const distance = root.querySelector("[data-scenario-distance]");
  const windowEl = root.querySelector("[data-scenario-window]");
  const panel = root.querySelector("[data-scenario-panel]");
  const photo = document.querySelector("[data-scenario-photo]");
  const photoLabel = document.querySelector("[data-scenario-photo-label]");
  const photoTitle = document.querySelector("[data-scenario-photo-title]");
  const photoCopy = document.querySelector("[data-scenario-photo-copy]");
  const overlayPrimary = document.querySelector("[data-overlay-primary]");
  const overlaySecondary = document.querySelector("[data-overlay-secondary]");
  const heroStage = document.querySelector("[data-hero-stage]");

  const applyScenario = (key) => {
    const data = scenarioData[key];
    if (!data) return;

    buttons.forEach((button) => {
      const active = button.dataset.scenarioButton === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (panel) {
      panel.classList.remove("is-swapping");
      void panel.offsetWidth;
      panel.classList.add("is-swapping");
    }

    if (label) label.textContent = data.label;
    if (title) title.textContent = data.title;
    if (copy) copy.textContent = data.copy;
    if (age) age.textContent = data.age;
    if (distance) distance.textContent = data.distance;
    if (windowEl) windowEl.textContent = data.window;
    if (photo) {
      photo.src = data.photo;
      photo.alt = data.photoAlt;
    }
    if (photoLabel) photoLabel.textContent = data.photoLabel;
    if (photoTitle) photoTitle.textContent = data.photoTitle;
    if (photoCopy) photoCopy.textContent = data.photoCopy;
    if (overlayPrimary) overlayPrimary.textContent = data.overlayPrimary;
    if (overlaySecondary) overlaySecondary.textContent = data.overlaySecondary;
    if (heroStage) heroStage.style.setProperty("--scenario-accent", data.accent);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyScenario(button.dataset.scenarioButton);
    });
  });

  applyScenario("campus");
}

function setupParallaxStage() {
  const heroStage = document.querySelector("[data-hero-stage]");
  const card = document.querySelector("[data-parallax-card]");
  if (!heroStage || !card) return;

  const reset = () => {
    card.style.transform = "";
    heroStage.style.removeProperty("--spot-x");
    heroStage.style.removeProperty("--spot-y");
  };

  heroStage.addEventListener("pointermove", (event) => {
    const rect = heroStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 8;
    const rotateX = (0.5 - y) * 8;

    card.style.transform = `perspective(1400px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;
    heroStage.style.setProperty("--spot-x", `${(x * 100).toFixed(1)}%`);
    heroStage.style.setProperty("--spot-y", `${(y * 100).toFixed(1)}%`);
  });

  heroStage.addEventListener("pointerleave", reset);
}

function setupVideos() {
  document.querySelectorAll("video").forEach((video) => {
    const panel = video.closest(".video-panel");
    const fallback = panel?.querySelector("[data-video-fallback]");

    const showFallback = (message) => {
      if (!fallback) return;
      fallback.hidden = false;
      fallback.textContent = message;
    };

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        video.controls = true;
        showFallback("Autoplay was blocked in this browser preview. Use the video controls to start playback.");
      });
    }

    video.addEventListener("error", () => {
      video.controls = true;
      showFallback("This browser preview could not decode the embedded video.");
    });

    video.addEventListener("loadeddata", () => {
      if (fallback) fallback.hidden = true;
    });
  });
}

setupScenarioSwitcher();
setupParallaxStage();
setupVideos();
