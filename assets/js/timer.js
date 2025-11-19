document.addEventListener("DOMContentLoaded", () => {
  const displayEl = document.getElementById("timerDisplay");
  const minutesInput = document.getElementById("timerMinutes");
  const secondsInput = document.getElementById("timerSeconds");
  const startPauseBtn = document.getElementById("timerStartPause");
  const resetBtn = document.getElementById("timerReset");
  const statusEl = document.getElementById("timerStatus");
  const presetButtons = document.querySelectorAll(".timer-preset");
  const endSound = document.getElementById("timerEndSound");

  if (
    !displayEl ||
    !minutesInput ||
    !secondsInput ||
    !startPauseBtn ||
    !resetBtn ||
    !statusEl
  ) {
    return;
  }

  const state = {
    isRunning: false,
    remainMs: 0,
    targetMs: 0,
    lastTick: 0,
    finished: false
  };

  function clampNumber(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    }
    return `${pad2(minutes)}:${pad2(seconds)}`;
  }

  function readInputsToDurationMs() {
    let m = parseInt(minutesInput.value, 10);
    let s = parseInt(secondsInput.value, 10);

    m = clampNumber(Number.isNaN(m) ? 0 : m, 0, 599);
    s = clampNumber(Number.isNaN(s) ? 0 : s, 0, 59);

    minutesInput.value = m;
    secondsInput.value = s;

    const totalMs = (m * 60 + s) * 1000;
    return totalMs;
  }

  function updateDisplay() {
    displayEl.textContent = formatMs(state.remainMs);
    if (state.finished) {
      displayEl.classList.add("timer-finished");
    } else {
      displayEl.classList.remove("timer-finished");
    }
  }

  function updateStatus(text) {
    statusEl.textContent = text;
  }

  function updateWarningState() {
    if (state.remainMs > 0 && state.remainMs <= 10000 && !state.finished) {
      displayEl.classList.add("timer-warning");
    } else {
      displayEl.classList.remove("timer-warning");
    }
  }

  function startTimer() {
    if (state.remainMs <= 0) {
      // 入力値から取得
      state.targetMs = readInputsToDurationMs();
      state.remainMs = state.targetMs;
      state.finished = false;
    }

    if (state.remainMs <= 0) {
      updateStatus("時間を設定してください");
      return;
    }

    state.isRunning = true;
    state.lastTick = Date.now();
    state.finished = false;
    startPauseBtn.textContent = "一時停止";
    resetBtn.disabled = false;
    updateStatus("カウントダウン中");
    updateWarningState();
    updateDisplay();
  }

  function pauseTimer() {
    state.isRunning = false;
    startPauseBtn.textContent = "再開";
    if (state.remainMs > 0 && !state.finished) {
      updateStatus("一時停止中");
    }
  }

  function resetTimer() {
    state.isRunning = false;
    state.remainMs = 0;
    state.targetMs = 0;
    state.finished = false;
    displayEl.classList.remove("timer-finished");
    displayEl.classList.remove("timer-warning");
    updateDisplay();
    updateStatus("待機中");
    startPauseBtn.textContent = "スタート";
    resetBtn.disabled = true;
  }

  function finishTimer() {
    state.isRunning = false;
    state.remainMs = 0;
    state.finished = true;
    displayEl.classList.remove("timer-warning");
    updateDisplay();
    updateStatus("時間になりました");
    startPauseBtn.textContent = "スタート";
    resetBtn.disabled = false;

    try {
      if (endSound && window.MultiClockUtils) {
        window.MultiClockUtils.playSound(endSound);
      }
    } catch {
      // 無視
    }
  }

  function tick() {
    if (!state.isRunning) return;
    const now = Date.now();
    const delta = now - state.lastTick;
    state.lastTick = now;

    state.remainMs -= delta;
    if (state.remainMs <= 0) {
      state.remainMs = 0;
      updateWarningState();
      finishTimer();
    } else {
      updateWarningState();
      updateDisplay();
    }
  }

  // スタート／一時停止
  startPauseBtn.addEventListener("click", () => {
    if (!state.isRunning) {
      startTimer();
    } else {
      pauseTimer();
    }
  });

  // リセット
  resetBtn.addEventListener("click", () => {
    resetTimer();
  });

  // プリセットボタン
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const seconds = parseInt(btn.dataset.seconds, 10);
      if (Number.isNaN(seconds)) return;

      state.isRunning = false;
      state.finished = false;
      state.targetMs = seconds * 1000;
      state.remainMs = state.targetMs;

      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      minutesInput.value = m;
      secondsInput.value = s;

      displayEl.classList.remove("timer-finished");
      displayEl.classList.remove("timer-warning");
      resetBtn.disabled = false;
      startPauseBtn.textContent = "スタート";
      updateDisplay();
      updateStatus(`${m}分${s}秒にセットしました`);
    });
  });

  // 初期状態
  resetBtn.disabled = true;
  state.remainMs = 0;
  updateDisplay();
  updateStatus("待機中");

  // 更新ループ
  setInterval(tick, 200);
});
