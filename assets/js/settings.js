(function () {
  const STORAGE_KEY = "multi-clock-lab-settings";
  const DEFAULT_SETTINGS = {
    defaultTab: "clock",
    soundEnabled: true
  };

  function loadSettings() {
    let settings = { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          settings = { ...settings, ...parsed };
        }
      }
    } catch {
      // 何もしない（デフォルトを使う）
    }
    return settings;
  }

  function saveSettings(partial) {
    const current = loadSettings();
    const next = { ...current, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 保存できない環境は無視
    }
    return next;
  }

  // 他のJSからも読めるようにグローバルに出しておく
  window.MultiClockSettings = {
    load: loadSettings,
    save: saveSettings
  };

  document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("settingsOverlay");
    const openBtn = document.getElementById("settingsOpenBtn");
    const closeBtn = document.getElementById("settingsCloseBtn");
    const defaultTabSelect = document.getElementById("settingDefaultTab");
    const soundCheckbox = document.getElementById("settingSoundEnabled");

    if (!overlay || !openBtn || !closeBtn || !defaultTabSelect || !soundCheckbox) {
      return;
    }

    function applySettingsToUI() {
      const s = loadSettings();
      defaultTabSelect.value = s.defaultTab || "clock";
      soundCheckbox.checked = s.soundEnabled !== false;
    }

    function open() {
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
    }

    function close() {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
    }

    openBtn.addEventListener("click", () => {
      applySettingsToUI();
      open();
    });

    closeBtn.addEventListener("click", () => {
      close();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        close();
      }
    });

    defaultTabSelect.addEventListener("change", () => {
      saveSettings({ defaultTab: defaultTabSelect.value });
    });

    soundCheckbox.addEventListener("change", () => {
      saveSettings({ soundEnabled: soundCheckbox.checked });
    });

    // 初期UI反映
    applySettingsToUI();
  });
})();
