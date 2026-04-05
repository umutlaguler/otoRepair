const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const MONTHS_TR_SHORT = [
  'OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ',
  'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA',
];

/**
 * "2024-03-12" -> "12 Mart 2024"
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTHS_TR[month]} ${year}`;
}

/**
 * "2024-06-10" -> "10.06.2024"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

/**
 * "2024-06-10" -> "10 HAZ 2024"
 */
export function formatDateCompact(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTHS_TR_SHORT[month]} ${year}`;
}

/**
 * Bugünün tarihini "YYYY-MM-DD" formatında döndürür
 */
export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verilen tarih son N gün içinde mi kontrol eder
 */
export function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}
