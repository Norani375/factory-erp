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

export function formatJalali(d: string): string {
  return formatDate(d);
}

export const CATEGORIES = ['تخته', 'تخت خواب', 'میز آرایش', 'الماری', 'شیشه', 'پوم', 'بخمل', 'سایر'];
export const PAYMENT_METHODS = ['نقد', 'چک', 'کارت', 'انتقال بانکی'];
export const UNITS = ['عدد', 'دانه', 'کارتن', 'قوتی', 'پاکت', 'متر', 'توپ', 'لوله', 'سیت'];

export function exportToCSV(data: any[], filename: string, headers: { key: string; label: string }[]) {
  const BOM = '\uFEFF';
  const headerRow = headers.map(h => h.label).join(',');
  const rows = data.map(row => headers.map(h => {
    const val = String(row[h.key] ?? '');
    return val.includes(',') ? `"${val}"` : val;
  }).join(','));
  const csv = BOM + headerRow + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '.csv';
  link.click();
}
