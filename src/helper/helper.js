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

export {
  toFarsiNumber,
  idGenerator,
};
