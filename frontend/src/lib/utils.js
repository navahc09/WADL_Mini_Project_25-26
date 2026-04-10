export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function toTitleCase(value) {
  return value.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}
