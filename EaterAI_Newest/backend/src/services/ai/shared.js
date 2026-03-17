const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
    
const normalizeVietnamese = (value = "") => normalizeText(value).replace(/đ/g, "d");
const containsAny = (value, keywords = []) => keywords.some((keyword) => value.includes(keyword));

const detectLanguage = (message = "") => {
  const raw = message.toLowerCase();
  const normalized = normalizeVietnamese(message);
  const vietnameseMarkers = [
    "mon",
    "goi y",
    "khong",
    "cay",
    "ngan sach",
    "di ung",
    "ban",
    "uong",
    "re",
    "it calo",
  ];

  if (/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i.test(raw)) {
    return "vi";
  }

  return containsAny(normalized, vietnameseMarkers) ? "vi" : "en";
};

const parseBudget = (message = "") => {
  const normalizedMessage = normalizeVietnamese(message);
  const budgetMatch = normalizedMessage.match(/(?:under|below|within|duoi|toi da|max)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i);

  if (budgetMatch) {
    return Number(budgetMatch[1]);
  }

  const dollarMatch = normalizedMessage.match(/\$\s*(\d+(?:\.\d{1,2})?)/i);
  return dollarMatch ? Number(dollarMatch[1]) : null;
};

const parseCalories = (message = "") => {
  const normalizedMessage = normalizeVietnamese(message);
  const limitMatch = normalizedMessage.match(/(?:under|below|less than|duoi|toi da|max)\s*(\d{2,4})\s*(?:cal|calo|calories)\b/i);

  if (limitMatch) {
    return Number(limitMatch[1]);
  }

  if (/(low calorie|low cal|it calo|giam can)/i.test(normalizedMessage)) {
    return 600;
  }

  return null;
};

const tokenize = (message = "") =>
  normalizeVietnamese(message)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

const unique = (items = []) => [...new Set(items.filter(Boolean))];

module.exports = {
  containsAny,
  detectLanguage,
  normalizeText,
  normalizeVietnamese,
  parseBudget,
  parseCalories,
  tokenize,
  unique,
};
