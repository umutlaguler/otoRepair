/**
 * Sayıyı Türk Lirası formatında döndürür
 * 1500 -> "1.500"
 * 12450 -> "12.450"
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '0';
  return Number(amount).toLocaleString('tr-TR');
}

/**
 * Sayıyı TL birimli string olarak döndürür
 * 1500 -> "1.500 TL"
 */
export function formatPriceTL(amount) {
  return `${formatPrice(amount)} TL`;
}

/**
 * Sayıyı ₺ birimli string olarak döndürür
 * 1500 -> "1.500 ₺"
 */
export function formatPriceLira(amount) {
  return `${formatPrice(amount)} ₺`;
}

/**
 * Sayıyı ondalıklı TL formatında döndürür
 * 450 -> "450,00 ₺"
 */
export function formatPriceDecimal(amount) {
  if (amount === null || amount === undefined) return '0,00 ₺';
  const formatted = Number(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ₺`;
}
