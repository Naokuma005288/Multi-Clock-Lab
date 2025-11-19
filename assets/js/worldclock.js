document.addEventListener("DOMContentLoaded", () => {
  const presetSelect = document.getElementById("wcPresetSelect");
  const customTzInput = document.getElementById("wcCustomTz");
  const labelInput = document.getElementById("wcLabelInput");
  const addBtn = document.getElementById("wcAddBtn");
  const tableBody = document.getElementById("worldclockTableBody");
  const emptyMessage = document.getElementById("worldclockEmptyMessage");

  if (!presetSelect || !addBtn || !tableBody) {
    return;
  }

  const STORAGE_KEY = "multi-clock-lab-worldclocks";

  let clocks = [];

  function uuid() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `wc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function isValidTimeZone(tz) {
    try {
      // 無効なタイムゾーンだとここで RangeError
      new Intl.DateTimeFormat("ja-JP", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }

  function loadWorldClocks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          clocks = parsed.filter(
            (c) =>
              c &&
              typeof c.timeZone === "string" &&
              isValidTimeZone(c.timeZone)
          );
        }
      }
    } catch {
      // 無視
    }

    // 初回 or 無効データしかなかったらデフォルト
    if (!Array.isArray(clocks) || clocks.length === 0) {
      clocks = [
        { id: uuid(), label: "Tokyo", timeZone: "Asia/Tokyo" },
        { id: uuid(), label: "London", timeZone: "Europe/London" },
        { id: uuid(), label: "New York", timeZone: "America/New_York" }
      ];
      saveWorldClocks();
    }
  }

  function saveWorldClocks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clocks));
    } catch {
      // 保存できない環境は無視
    }
  }

  function formatOffsetLabel(offsetMinutes) {
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;
    if (minutes === 0) {
      return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours}:${pad2(minutes)}`;
  }

  function formatDiffFromLocal(diffMinutes) {
    if (diffMinutes === 0) return "ローカルと同じ";
    const sign = diffMinutes > 0 ? "+" : "-";
    const abs = Math.abs(diffMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;
    const hourPart =
      hours > 0 ? `${hours}時間` : minutes > 0 ? "" : "0時間";
    const minutePart = minutes > 0 ? `${minutes}分` : "";
    return `ローカルより${sign}${hourPart}${minutePart}`;
  }

  function renderWorldClocks() {
    const now = new Date();
    const localOffset = -now.getTimezoneOffset(); // 分

    tableBody.innerHTML = "";

    if (!clocks || clocks.length === 0) {
      if (emptyMessage) emptyMessage.style.display = "block";
      return;
    }
    if (emptyMessage) emptyMessage.style.display = "none";

    clocks.forEach((clock) => {
      const tr = document.createElement("tr");

      let timeStr = "--:--:--";
      let dateStr = "----/--/--";
      let offsetLabel = "";
      let diffLabel = "";

      try {
        const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
          timeZone: clock.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
          timeZone: clock.timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          weekday: "short"
        });

        timeStr = timeFormatter.format(now);
        dateStr = dateFormatter.format(now);

        // タイムゾーンのUTCオフセット計算
        const dateInTz = new Date(
          now.toLocaleString("en-US", { timeZone: clock.timeZone })
        );
        const diffFromLocal = (dateInTz.getTime() - now.getTime()) / 60000; // 分
        const tzOffset = localOffset + diffFromLocal;
        offsetLabel = formatOffsetLabel(Math.round(tzOffset));
        diffLabel = formatDiffFromLocal(Math.round(tzOffset - localOffset));
      } catch {
        offsetLabel = "不明";
        diffLabel = "タイムゾーンエラー";
      }

      // 都市
      const cityTd = document.createElement("td");
      cityTd.textContent = clock.label || clock.timeZone;

      // 時刻
      const timeTd = document.createElement("td");
      timeTd.textContent = timeStr;

      // 日付
      const dateTd = document.createElement("td");
      dateTd.textContent = dateStr;

      // UTC
      const utcTd = document.createElement("td");
      utcTd.textContent = offsetLabel;

      // 時差
      const diffTd = document.createElement("td");
      diffTd.textContent = diffLabel;
      diffTd.className = "worldclock-offset";

      // 削除
      const delTd = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "icon-button";
      delBtn.textContent = "✕";
      delTd.appendChild(delBtn);

      delBtn.addEventListener("click", () => {
        clocks = clocks.filter((c) => c.id !== clock.id);
        saveWorldClocks();
        renderWorldClocks();
      });

      tr.appendChild(cityTd);
      tr.appendChild(timeTd);
      tr.appendChild(dateTd);
      tr.appendChild(utcTd);
      tr.appendChild(diffTd);
      tr.appendChild(delTd);

      tableBody.appendChild(tr);
    });
  }

  function addWorldClock() {
    const customTz = (customTzInput?.value || "").trim();
    const presetTz = presetSelect.value;
    let tz = customTz || presetTz;

    if (!tz) {
      // 何も選ばれてない
      return;
    }

    if (!isValidTimeZone(tz)) {
      alert("タイムゾーンIDが正しくありません。例: Europe/Berlin");
      return;
    }

    let label = (labelInput?.value || "").trim();
    if (!label) {
      if (customTz) {
        label = customTz;
      } else {
        const opt = presetSelect.selectedOptions[0];
        label = opt?.dataset.label || presetTz;
      }
    }

    const newClock = {
      id: uuid(),
      label,
      timeZone: tz
    };

    clocks.push(newClock);
    saveWorldClocks();
    renderWorldClocks();

    if (labelInput) labelInput.value = "";
    if (customTzInput) customTzInput.value = "";
  }

  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addWorldClock();
  });

  customTzInput &&
    customTzInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addWorldClock();
      }
    });

  labelInput &&
    labelInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addWorldClock();
      }
    });

  // 初期化
  loadWorldClocks();
  renderWorldClocks();

  // 1秒ごとに表示更新
  setInterval(renderWorldClocks, 1000);
});
