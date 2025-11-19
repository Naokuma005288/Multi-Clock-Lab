document.addEventListener("DOMContentLoaded", () => {
  const phaseLabelEl = document.getElementById("pomPhaseLabel");
  const displayEl = document.getElementById("pomDisplay");
  const progressEl = document.getElementById("pomProgressDots");
  const startPauseBtn = document.getElementById("pomStartPause");
  const skipBtn = document.getElementById("pomSkip");
  const resetBtn = document.getElementById("pomReset");
  const workInput = document.getElementById("pomWorkMinutes");
  const breakInput = document.getElementById("pomBreakMinutes");
  const phaseSound = document.getElementById("pomPhaseSound");
  const pomCard = document.querySelector(".pomodoro-card");
  const statsSummaryEl = document.getElementById("pomStatsSummary");

  if (
    !phaseLabelEl ||
    !displayEl ||
    !progressEl ||
    !startPauseBtn ||
    !skipBtn ||
    !resetBtn ||
    !workInput ||
    !breakInput
  ) {
    return;
  }

  const STATS_STORAGE_KEY = "multi-clock-lab-stats";

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${pad2(minutes)}:${pad2(seconds)}`;
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // 保存できない環境は無視
    }
  }

  function getTodayKey() {
    if (window.MultiClockUtils && window.MultiClockUtils.getDateKey) {
      return window.MultiClockUtils.getDateKey();
    }
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function updatePomStatsSummary() {
    if (!statsSummaryEl) return;
    const stats = loadStats();
    const key = getTodayKey();
    const day = stats[key] || { pomodoroMinutes: 0, pomodoroSessions: 0 };
    statsSummaryEl.textContent = `今日の集中時間: ${
      day.pomodoroMinutes || 0
    }分 / 完了セッション: ${day.pomodoroSessions || 0}`;
  }

  function recordWorkSession(durationMs) {
    const stats = loadStats();
    const key = getTodayKey();
    const day = stats[key] || { pomodoroMinutes: 0, pomodoroSessions: 0 };
    const addMinutes = Math.round(durationMs / 60000);
    day.pomodoroMinutes = (day.pomodoroMinutes || 0) + addMinutes;
    day.pomodoroSessions = (day.pomodoroSessions || 0) + 1;
    stats[key] = day;
    saveStats(stats);
    updatePomStatsSummary();
  }

  const state = {
    phase: "idle", // "idle" | "work" | "shortBreak" | "longBreak"
    isRunning: false,
    remainMs: 0,
    workMs: 25 * 60 * 1000,
    shortBreakMs: 5 * 60 * 1000,
    longBreakMs: 15 * 60 * 1000,
    completedWorkSessions: 0, // 作業フェーズ完了数
    lastTick: 0
  };

  function readSettings() {
    let work = parseInt(workInput.value, 10);
    let brk = parseInt(breakInput.value, 10);

    if (Number.isNaN(work) || work <= 0) work = 25;
    if (Number.isNaN(brk) || brk <= 0) brk = 5;

    work = Math.min(Math.max(work, 1), 180);
    brk = Math.min(Math.max(brk, 1), 60);

    workInput.value = work;
    breakInput.value = brk;

    state.workMs = work * 60 * 1000;
    state.shortBreakMs = brk * 60 * 1000;
    // ロングブレイクは少し長め（ここでは休憩の3倍か最低10分）
    state.longBreakMs = Math.max(brk * 3 * 60 * 1000, 10 * 60 * 1000);
  }

  function updateProgressDots() {
    progressEl.innerHTML = "";
    const maxDots = 4;
    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement("div");
      dot.className = "pom-dot";
      if (state.completedWorkSessions > i) {
        dot.classList.add("completed");
      }
      progressEl.appendChild(dot);
    }
  }

  function updatePhaseLabel() {
    let text = "待機中";
    if (state.phase === "work") text = "作業中";
    else if (state.phase === "shortBreak") text = "休憩中";
    else if (state.phase === "longBreak") text = "長めの休憩中";

    phaseLabelEl.textContent = text;
  }

  function updateCardPhaseClass() {
    if (!pomCard) return;
    pomCard.classList.remove("phase-work", "phase-break", "phase-longbreak");
    if (state.phase === "work") {
      pomCard.classList.add("phase-work");
    } else if (state.phase === "shortBreak") {
      pomCard.classList.add("phase-break");
    } else if (state.phase === "longBreak") {
      pomCard.classList.add("phase-longbreak");
    }
  }

  function updateDisplay() {
    displayEl.textContent = formatMs(state.remainMs);
    displayEl.classList.remove("phase-work", "phase-break", "phase-longBreak");

    if (state.phase === "work") {
      displayEl.classList.add("phase-work");
    } else if (state.phase === "shortBreak") {
      displayEl.classList.add("phase-break");
    } else if (state.phase === "longBreak") {
      displayEl.classList.add("phase-longBreak");
    }
  }

  function playPhaseSound() {
    try {
      if (phaseSound && window.MultiClockUtils) {
        window.MultiClockUtils.playSound(phaseSound);
      }
    } catch {
      // 無視
    }
  }

  function enterPhase(phase) {
    state.phase = phase;
    if (phase === "work") {
      state.remainMs = state.workMs;
    } else if (phase === "shortBreak") {
      state.remainMs = state.shortBreakMs;
    } else if (phase === "longBreak") {
      state.remainMs = state.longBreakMs;
    } else {
      // idle
      state.remainMs = state.workMs;
    }
    updatePhaseLabel();
    updateCardPhaseClass();
    updateDisplay();
    updateProgressDots();
    if (phase !== "idle") {
      playPhaseSound();
    }
  }

  function nextPhase(autoCompleted) {
    if (state.phase === "work") {
      if (autoCompleted) {
        recordWorkSession(state.workMs);
      }
      state.completedWorkSessions += 1;
      // 4セットごとにロングブレイク
      if (state.completedWorkSessions % 4 === 0) {
        enterPhase("longBreak");
      } else {
        enterPhase("shortBreak");
      }
    } else if (state.phase === "shortBreak" || state.phase === "longBreak") {
      enterPhase("work");
    } else {
      // idle -> work
      enterPhase("work");
    }
  }

  function startPomodoro() {
    if (state.phase === "idle") {
      readSettings();
      enterPhase("work");
    }
    state.isRunning = true;
    state.lastTick = Date.now();
    startPauseBtn.textContent = "一時停止";
    skipBtn.disabled = false;
    resetBtn.disabled = false;
    workInput.disabled = true;
    breakInput.disabled = true;
  }

  function pausePomodoro() {
    state.isRunning = false;
    startPauseBtn.textContent = "再開";
  }

  function resetPomodoro() {
    state.isRunning = false;
    state.phase = "idle";
    state.completedWorkSessions = 0;
    readSettings();
    state.remainMs = state.workMs;
    updatePhaseLabel();
    updateCardPhaseClass();
    updateDisplay();
    updateProgressDots();
    startPauseBtn.textContent = "スタート";
    skipBtn.disabled = true;
    resetBtn.disabled = true;
    workInput.disabled = false;
    breakInput.disabled = false;
  }

  function tick() {
    if (!state.isRunning) return;
    const now = Date.now();
    const delta = now - state.lastTick;
    state.lastTick = now;

    state.remainMs -= delta;
    if (state.remainMs <= 0) {
      state.remainMs = 0;
      updateDisplay();
      // 現フェーズ終了 → 次フェーズへ（自動完了扱い）
      nextPhase(true);
      // 入ったフェーズをすぐ走らせる
      state.lastTick = Date.now();
    } else {
      updateDisplay();
    }
  }

  // ボタンイベント
  startPauseBtn.addEventListener("click", () => {
    if (!state.isRunning) {
      startPomodoro();
    } else {
      pausePomodoro();
    }
  });

  skipBtn.addEventListener("click", () => {
    if (state.phase === "idle") return;
    const wasRunning = state.isRunning;
    state.isRunning = false;
    // スキップは自動完了扱いではない
    nextPhase(false);
    if (wasRunning) {
      state.isRunning = true;
      state.lastTick = Date.now();
    } else {
      startPauseBtn.textContent = "再開";
    }
  });

  resetBtn.addEventListener("click", () => {
    resetPomodoro();
  });

  // 設定変更時（停止中のみ有効）
  [workInput, breakInput].forEach((input) => {
    input.addEventListener("change", () => {
      if (state.isRunning || state.phase !== "idle") {
        // 動作中は無視
        return;
      }
      readSettings();
      state.remainMs = state.workMs;
      updateDisplay();
    });
  });

  // 初期状態
  readSettings();
  state.remainMs = state.workMs;
  updatePhaseLabel();
  updateCardPhaseClass();
  updateDisplay();
  updateProgressDots();
  skipBtn.disabled = true;
  resetBtn.disabled = true;
  updatePomStatsSummary();

  // 更新ループ
  setInterval(tick, 200);
});
