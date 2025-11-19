(function () {
  function getDateKey(date) {
    const d = date instanceof Date ? date : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function isSoundEnabled() {
    try {
      if (
        window.MultiClockSettings &&
        typeof window.MultiClockSettings.load === "function"
      ) {
        const s = window.MultiClockSettings.load();
        return s.soundEnabled !== false;
      }
    } catch {
      // 無視（有効扱い）
    }
    return true;
  }

  function playSound(audioElement) {
    if (!audioElement) return;
    if (!isSoundEnabled()) return;
    try {
      audioElement.currentTime = 0;
      audioElement.play();
    } catch {
      // 再生できない環境は無視
    }
  }

  window.MultiClockUtils = {
    getDateKey,
    isSoundEnabled,
    playSound
  };
})();
