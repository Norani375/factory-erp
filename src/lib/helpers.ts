export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fa-AF').format(n);
}

export function formatCurrency(n: number): string {
  return formatNumber(n) + ' ؋';
}

export function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('fa-AF', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const CATEGORIES = ['تخته', 'تخت خواب', 'میز آرایش', 'الماری', 'شیشه', 'پوم', 'بخمل', 'سایر'];
export const PAYMENT_METHODS = ['نقد', 'چک', 'کارت', 'انتقال بانکی'];
export const UNITS = ['عدد', 'دانه', 'کارتن', 'قوتی', 'پاکت', 'متر', 'توپ', 'لوله', 'سیت'];
