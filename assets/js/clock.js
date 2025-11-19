document.addEventListener("DOMContentLoaded", () => {
  const digitH1 = document.getElementById("digit-h1");
  const digitH2 = document.getElementById("digit-h2");
  const digitM1 = document.getElementById("digit-m1");
  const digitM2 = document.getElementById("digit-m2");
  const digitS1 = document.getElementById("digit-s1");
  const digitS2 = document.getElementById("digit-s2");

  const digitalDateEl = document.getElementById("digitalDate");
  const hourHandEl = document.getElementById("hourHand");
  const minuteHandEl = document.getElementById("minuteHand");
  const secondHandEl = document.getElementById("secondHand");
  const toggleFormatBtn = document.getElementById("toggleFormatBtn");

  if (
    !digitH1 ||
    !digitH2 ||
    !digitM1 ||
    !digitM2 ||
    !digitS1 ||
    !digitS2 ||
    !digitalDateEl ||
    !hourHandEl ||
    !minuteHandEl ||
    !secondHandEl
  ) {
    console.warn("Clock elements are missing.");
    return;
  }

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  let is24HourFormat = true;
  let firstRender = true;
  let prevDigits = "------";
  let prevSecond = null;

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function setDigit(el, newChar, index) {
    if (!el) return;

    if (firstRender) {
      el.textContent = newChar;
      return;
    }

    if (prevDigits[index] === newChar) {
      return;
    }

    el.textContent = newChar;
    el.classList.remove("digit-flip");
    // reflowしてアニメ再スタート
    void el.offsetWidth;
    el.classList.add("digit-flip");
  }

  function updateDigital(now) {
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const displayHours = is24HourFormat
      ? hours
      : hours % 12 === 0
      ? 12
      : hours % 12;

    const hStr = pad(displayHours);
    const mStr = pad(minutes);
    const sStr = pad(seconds);
    const digits = `${hStr}${mStr}${sStr}`;

    setDigit(digitH1, digits[0], 0);
    setDigit(digitH2, digits[1], 1);
    setDigit(digitM1, digits[2], 2);
    setDigit(digitM2, digits[3], 3);
    setDigit(digitS1, digits[4], 4);
    setDigit(digitS2, digits[5], 5);

    if (firstRender) {
      firstRender = false;
    }
    prevDigits = digits;

    const w = weekdays[now.getDay()];
    const dateStr = `${now.getFullYear()} / ${pad(
      now.getMonth() + 1
    )} / ${pad(now.getDate())} (${w})`;
    digitalDateEl.textContent = dateStr;
  }

  function updateAnalog(now) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const secDeg = seconds * 6; // 360 / 60
    const minDeg = minutes * 6 + seconds * 0.1; // 6°/分 + 0.1°/秒
    const hourDeg = (hours % 12) * 30 + minutes * 0.5; // 30°/時 + 0.5°/分

    hourHandEl.style.transform = `translate(-50%, -100%) rotate(${hourDeg}deg)`;
    minuteHandEl.style.transform = `translate(-50%, -100%) rotate(${minDeg}deg)`;

    // 59→0のときは一旦トランジションを切ってジャンプさせる
    if (prevSecond === 59 && seconds === 0) {
      secondHandEl.style.transition = "none";
      secondHandEl.style.transform = `translate(-50%, -100%) rotate(${secDeg}deg)`;
      // reflow
      void secondHandEl.offsetHeight;
      secondHandEl.style.transition = "transform 0.08s linear";
    } else {
      secondHandEl.style.transform = `translate(-50%, -100%) rotate(${secDeg}deg)`;
    }
    prevSecond = seconds;
  }

  function refreshClock() {
    const now = new Date();
    updateDigital(now);
    updateAnalog(now);
  }

  function updateFormatButtonLabel() {
    if (!toggleFormatBtn) return;
    toggleFormatBtn.textContent = is24HourFormat ? "24h" : "12h";
  }

  if (toggleFormatBtn) {
    toggleFormatBtn.addEventListener("click", () => {
      is24HourFormat = !is24HourFormat;
      updateFormatButtonLabel();
      refreshClock();
    });
  }

  // 初期表示＆1秒ごとの更新
  updateFormatButtonLabel();
  refreshClock();
  setInterval(refreshClock, 1000);
});
