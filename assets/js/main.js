document.addEventListener("DOMContentLoaded", () => {
  // タブ切り替え
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  function switchTab(target) {
    if (!target) return;

    tabButtons.forEach((btn) => {
      const isTarget = btn.dataset.tab === target;
      btn.classList.toggle("active", isTarget);
    });

    tabContents.forEach((content) => {
      const id = content.id.replace("tab-", "");
      const isTarget = id === target;
      content.classList.toggle("active", isTarget);
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      switchTab(target);
    });
  });

  // デフォルトタブ（設定から読み込み）
  let defaultTab = "clock";
  try {
    if (
      window.MultiClockSettings &&
      typeof window.MultiClockSettings.load === "function"
    ) {
      defaultTab = window.MultiClockSettings.load().defaultTab || "clock";
    }
  } catch {
    // 何もしない
  }

  const validTabs = Array.from(tabButtons).map((b) => b.dataset.tab);
  if (!validTabs.includes(defaultTab)) {
    defaultTab = "clock";
  }
  switchTab(defaultTab);

  // テーマ切り替え
  const themeToggleBtn = document.getElementById("themeToggle");

  function applyTheme(mode) {
    if (mode === "light") {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      if (themeToggleBtn) themeToggleBtn.textContent = "🌙";
    } else {
      document.body.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
      if (themeToggleBtn) themeToggleBtn.textContent = "🌞";
    }
    try {
      localStorage.setItem("clock-theme", mode);
    } catch {
      // localStorage 使えない環境は無視
    }
  }

  if (themeToggleBtn) {
    // 保存されたテーマ or OS設定
    let initialTheme = "dark";
    try {
      const saved = localStorage.getItem("clock-theme");
      if (saved === "light" || saved === "dark") {
        initialTheme = saved;
      } else if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        initialTheme = "light";
      }
    } catch {
      // 何もしない
    }

    applyTheme(initialTheme);

    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      applyTheme(isDark ? "light" : "dark");
    });
  }
});
