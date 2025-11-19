document.addEventListener("DOMContentLoaded", () => {
  const displayEl = document.getElementById("stopwatchDisplay");
  const startPauseBtn = document.getElementById("swStartPause");
  const resetBtn = document.getElementById("swReset");
  const lapBtn = document.getElementById("swLap");
  const lapTbody = document.getElementById("swLapTbody");
  const lapEmptyMsg = document.getElementById("swLapEmpty");

  if (!displayEl || !startPauseBtn || !resetBtn || !lapBtn || !lapTbody) {
    return;
  }

  const state = {
    isRunning: false,
    startTimestamp: 0, // ms
    elapsedBeforeStart: 0, // ms
    laps: [] // { totalMs: number }
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatMs(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10); // 1/100 秒

    if (hours > 0) {
      return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`;
    }
    return `${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`;
  }

  function getTotalMs() {
    if (!state.isRunning) {
      return state.elapsedBeforeStart;
    }
    const now = Date.now();
    return state.elapsedBeforeStart + (now - state.startTimestamp);
  }

  function updateDisplay() {
    const totalMs = getTotalMs();
    displayEl.textContent = formatMs(totalMs);
  }

  function renderLaps() {
    lapTbody.innerHTML = "";
    let prevTotal = 0;
    state.laps.forEach((lap, index) => {
      const totalMs = lap.totalMs;
      const lapMs = totalMs - prevTotal;
      prevTotal = totalMs;

      const tr = document.createElement("tr");

      const noTd = document.createElement("td");
      noTd.textContent = `#${index + 1}`;

      const lapTd = document.createElement("td");
      lapTd.textContent = formatMs(lapMs);

      const totalTd = document.createElement("td");
      totalTd.textContent = formatMs(totalMs);

      tr.appendChild(noTd);
      tr.appendChild(lapTd);
      tr.appendChild(totalTd);

      lapTbody.appendChild(tr);
    });

    if (lapEmptyMsg) {
      lapEmptyMsg.style.display = state.laps.length === 0 ? "block" : "none";
    }
  }

  function setButtonsState() {
    const nowMs = getTotalMs();
    const hasElapsed = nowMs > 0 || state.laps.length > 0;
    resetBtn.disabled = !hasElapsed;
    lapBtn.disabled = !state.isRunning && nowMs === 0;
  }

  // スタート／一時停止
  startPauseBtn.addEventListener("click", () => {
    if (!state.isRunning) {
      // スタート or 再開
      state.isRunning = true;
      state.startTimestamp = Date.now();
      startPauseBtn.textContent = "一時停止";
      setButtonsState();
    } else {
      // 一時停止
      state.elapsedBeforeStart = getTotalMs();
      state.isRunning = false;
      startPauseBtn.textContent = "再開";
      setButtonsState();
    }
  });

  // リセット
  resetBtn.addEventListener("click", () => {
    state.isRunning = false;
    state.startTimestamp = 0;
    state.elapsedBeforeStart = 0;
    state.laps = [];
    displayEl.textContent = "00:00.00";
    lapTbody.innerHTML = "";
    if (lapEmptyMsg) lapEmptyMsg.style.display = "block";
    startPauseBtn.textContent = "スタート";
    setButtonsState();
  });

  // ラップ
  lapBtn.addEventListener("click", () => {
    const totalMs = getTotalMs();
    if (totalMs === 0) return;
    state.laps.push({ totalMs });
    renderLaps();
    setButtonsState();
  });

  // 初期状態
  updateDisplay();
  renderLaps();
  setButtonsState();

  // 20fps くらいで更新
  setInterval(updateDisplay, 50);
});
