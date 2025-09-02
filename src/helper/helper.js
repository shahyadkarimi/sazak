const idGenerator = () => Math.random().toString(36).substring(2, 8);

const toFarsiNumber = (num) => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  if (num) {
    return num
      .toLocaleString()
      .toString()
      .replace(/\d/g, (x) => farsiDigits[x]);
  } else {
    return (0)
      .toLocaleString()
      .toString()
      .replace(/\d/g, (x) => farsiDigits[x]);
  }
};

const snapToGrid = ([x, y, z], step = 1) => {
  return [Math.round(x / step) * step, y, Math.round(z / step) * step];
};

const greetByTime = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "صبح بخیر 🌅";
  } else if (hour >= 12 && hour < 18) {
    return "ظهر بخیر ☀️";
  } else if (hour >= 18 && hour < 22) {
    return "عصر بخیر 🌇";
  } else {
    return "شب بخیر 🌙";
  }
};

export { snapToGrid, toFarsiNumber, idGenerator, greetByTime };
