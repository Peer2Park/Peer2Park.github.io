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

setupVideos();
