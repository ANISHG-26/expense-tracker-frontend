const pad2 = (value) => String(value).padStart(2, "0");

const formatDate = (date) =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;

const parseDate = (value) => new Date(`${value}T00:00:00Z`);

const getWeekStart = (date) => {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() + diff);
  return start;
};

const getMonthStart = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const createCurrencyFormatter = (currency) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency || "CAD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatCurrency = (amount, currency, formatter) => {
  const value = Number(amount || 0);
  if (formatter) {
    return formatter.format(value);
  }
  return createCurrencyFormatter(currency).format(value);
};

export {
  createCurrencyFormatter,
  formatCurrency,
  formatDate,
  getMonthStart,
  getWeekStart,
  parseDate
};
