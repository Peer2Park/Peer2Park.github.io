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

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".od-reveal");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  elements.forEach((element) => observer.observe(element));
}

function setupContactForms() {
  const params = new URLSearchParams(window.location.search);

  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    const nextInput = form.querySelector('input[name="_next"]');
    const urlInput = form.querySelector('input[name="_url"]');
    const status = form.closest(".od-form-shell")?.querySelector("[data-form-status]") || null;

    if (window.location.protocol !== "file:") {
      const redirectUrl = new URL(window.location.href);
      redirectUrl.searchParams.set("submitted", "1");
      redirectUrl.hash = "contact-form";

      if (nextInput) nextInput.value = redirectUrl.toString();
      if (urlInput) urlInput.value = window.location.href.split("#")[0];
    }

    if (params.get("submitted") === "1" && status) {
      status.hidden = false;
      form.scrollIntoView({ block: "start" });
    }
  });
}

setupVideos();
setupRevealAnimations();
setupContactForms();
