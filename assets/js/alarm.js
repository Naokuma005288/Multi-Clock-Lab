document.addEventListener("DOMContentLoaded", () => {
  const timeInput = document.getElementById("alarmTimeInput");
  const labelInput = document.getElementById("alarmLabelInput");
  const addBtn = document.getElementById("alarmAddBtn");
  const tableBody = document.getElementById("alarmTableBody");
  const emptyMessage = document.getElementById("alarmEmptyMessage");
  const banner = document.getElementById("alarmBanner");
  const alarmSound = document.getElementById("alarmSound");

  if (!timeInput || !addBtn || !tableBody) {
    return;
  }

  const STORAGE_KEY = "multi-clock-lab-alarms";

  let alarms = [];
  let bannerTimeoutId = null;

  function uuid() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `alarm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function loadAlarms() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      alarms = parsed.map((a) => ({
        id: a.id || uuid(),
        hour: typeof a.hour === "number" ? a.hour : 0,
        minute: typeof a.minute === "number" ? a.minute : 0,
        label: typeof a.label === "string" ? a.label : "",
        enabled: Boolean(a.enabled),
        lastFiredDate: typeof a.lastFiredDate === "string" ? a.lastFiredDate : null
      }));
    } catch {
      // パース失敗時は何もしない
    }
  }

  function saveAlarms() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    } catch {
      // 保存できない環境は無視
    }
  }

  function showBanner(message) {
    if (!banner) return;
    banner.textContent = message;
    banner.classList.add("active");
    if (bannerTimeoutId) {
      clearTimeout(bannerTimeoutId);
    }
    bannerTimeoutId = setTimeout(() => {
      banner.classList.remove("active");
    }, 10000);
  }

  function renderAlarms() {
    tableBody.innerHTML = "";

    if (alarms.length === 0) {
      if (emptyMessage) emptyMessage.style.display = "block";
      return;
    }
    if (emptyMessage) emptyMessage.style.display = "none";

    alarms.forEach((alarm) => {
      const tr = document.createElement("tr");

      // ON/OFF
      const onTd = document.createElement("td");
      const switchLabel = document.createElement("label");
      switchLabel.className = "switch";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "alarm-toggle";
      checkbox.checked = alarm.enabled;
      const slider = document.createElement("span");
      slider.className = "switch-slider";
      switchLabel.appendChild(checkbox);
      switchLabel.appendChild(slider);
      onTd.appendChild(switchLabel);

      // 時刻
      const timeTd = document.createElement("td");
      timeTd.textContent = `${pad2(alarm.hour)}:${pad2(alarm.minute)}`;

      // ラベル
      const labelTd = document.createElement("td");
      labelTd.textContent = alarm.label || "アラーム";

      // 削除
      const delTd = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "icon-button alarm-delete-btn";
      delBtn.textContent = "✕";
      delTd.appendChild(delBtn);

      tr.appendChild(onTd);
      tr.appendChild(timeTd);
      tr.appendChild(labelTd);
      tr.appendChild(delTd);

      // イベント
      checkbox.addEventListener("change", () => {
        alarm.enabled = checkbox.checked;
        saveAlarms();
      });

      delBtn.addEventListener("click", () => {
        alarms = alarms.filter((a) => a.id !== alarm.id);
        saveAlarms();
        renderAlarms();
      });

      tableBody.appendChild(tr);
    });
  }

  function addAlarmFromForm() {
    const timeValue = timeInput.value;
    if (!timeValue) {
      showBanner("時刻を入力してください。");
      return;
    }

    const [hStr, mStr] = timeValue.split(":");
    let hour = parseInt(hStr, 10);
    let minute = parseInt(mStr, 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      showBanner("時刻の形式が正しくありません。");
      return;
    }
    hour = Math.min(Math.max(hour, 0), 23);
    minute = Math.min(Math.max(minute, 0), 59);

    const label = (labelInput.value || "").trim();

    const alarm = {
      id: uuid(),
      hour,
      minute,
      label,
      enabled: true,
      lastFiredDate: null
    };

    alarms.push(alarm);
    saveAlarms();
    renderAlarms();

    labelInput.value = "";
    showBanner(
      `${pad2(hour)}:${pad2(minute)}「${label || "アラーム"}」を追加しました。`
    );
  }

  function fireAlarm(alarm, todayStr) {
    alarm.lastFiredDate = todayStr;
    saveAlarms();

    const label = alarm.label || "アラーム";
    showBanner(`「${label}」の時間です (${pad2(alarm.hour)}:${pad2(alarm.minute)})`);

    try {
      if (alarmSound && window.MultiClockUtils) {
        window.MultiClockUtils.playSound(alarmSound);
      }
    } catch {
      // 再生できない場合は無視
    }
  }

  function checkAlarms() {
    if (alarms.length === 0) return;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const todayStr =
      (window.MultiClockUtils &&
        window.MultiClockUtils.getDateKey &&
        window.MultiClockUtils.getDateKey(now)) ||
      now.toISOString().slice(0, 10);

    alarms.forEach((alarm) => {
      if (!alarm.enabled) return;
      if (alarm.hour !== hour || alarm.minute !== minute) return;
      if (alarm.lastFiredDate === todayStr) return;

      fireAlarm(alarm, todayStr);
    });
  }

  // イベント登録
  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addAlarmFromForm();
  });

  timeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAlarmFromForm();
    }
  });
  labelInput &&
    labelInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addAlarmFromForm();
      }
    });

  // 初期化
  loadAlarms();
  renderAlarms();

  // 1秒ごとにチェック
  setInterval(checkAlarms, 1000);
});
