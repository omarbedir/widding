import type { Booking, Hall } from '../types';
import { getLocalSettings } from '../services/db';
import { DEFAULT_WHATSAPP_TEMPLATE } from '../components/WhatsAppTemplateModal';

export function formatPhoneForWhatsApp(phoneStr: string): string {
  if (!phoneStr) return '';
  let digits = phoneStr.replace(/\D/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '20' + digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('1')) {
    digits = '20' + digits;
  }
  return digits;
}

export function openWhatsAppBooking(booking: Booking, hall?: Hall | null): boolean {
  const cleanPhone = formatPhoneForWhatsApp(booking.phone);
  if (!cleanPhone) {
    return false;
  }

  const settings = getLocalSettings();
  const template = settings['whatsapp_template'] || DEFAULT_WHATSAPP_TEMPLATE;

  const basePrice = (booking.totalAmount || 0) - (booking.additionalServicesAmount || 0) + (booking.discount || 0);
  
  let paymentsText = '';
  if (booking.payments && booking.payments.length > 0) {
    paymentsText = 'سجل الدفعات:\n' + booking.payments.map((p, i) => {
      const d = new Date(p.date);
      return `- ${p.description || `الدفعة ${i + 1}`}: ${p.amount.toLocaleString()} ج.م (${d.toLocaleDateString('ar-EG')})`;
    }).join('\n');
  }

  let inclusionsText = '';
  if (hall?.inclusions) {
    inclusionsText = 'مشتملات القاعة:\n' + hall.inclusions.split('\n').filter(line => line.trim() !== '').map(line => `- ${line.trim()}`).join('\n');
  }

  const hallName = hall ? hall.name : 'قاعة غير معروفة';

  let additionsText = '';
  if (booking.additions && booking.additions.length > 0) {
    additionsText = 'تفاصيل الخدمات الإضافية:\n' + booking.additions.map(a => `- ${a.name}: ${a.price.toLocaleString()} ج.م`).join('\n');
  }

  let discountText = '';
  if (booking.discount && booking.discount > 0) {
    discountText = `قيمة الخصم: ${booking.discount.toLocaleString()} ج.م`;
  }

  let finalMsg = template
    .replace(/\[اسم_العريس\]/g, booking.groomName)
    .replace(/\[القاعة\]/g, hallName)
    .replace(/\[التاريخ\]/g, booking.date)
    .replace(/\[سعر_القاعة_الأساسي\]/g, basePrice.toLocaleString() + ' ج.م')
    .replace(/\[الخدمات_الإضافية\]/g, (booking.additionalServicesAmount || 0).toLocaleString() + ' ج.م')
    .replace(/\[المبلغ_الكلي\]/g, booking.totalAmount.toLocaleString() + ' ج.م')
    .replace(/\[إجمالي_المدفوع\]/g, booking.paidAmount.toLocaleString() + ' ج.م')
    .replace(/\[المتبقي\]/g, booking.remainingAmount.toLocaleString() + ' ج.م')
    .replace(/\[سجل_الدفعات\]/g, paymentsText)
    .replace(/\[مشتملات_القاعة\]/g, inclusionsText)
    .replace(/\[تفاصيل_الإضافات\]/g, additionsText)
    .replace(/\[قيمة_الخصم\]/g, discountText)
    .replace(/\[الملاحظات\]/g, booking.notes ? `📝 ملاحظات: ${booking.notes}` : '');

  // If the user's template doesn't have [مشتملات_القاعة] but inclusions exist, append it below payments
  if (!template.includes('[مشتملات_القاعة]') && inclusionsText) {
    const splitPoint = finalMsg.indexOf(paymentsText);
    if (splitPoint !== -1) {
      finalMsg = finalMsg.slice(0, splitPoint + paymentsText.length) + '\n\n' + inclusionsText + finalMsg.slice(splitPoint + paymentsText.length);
    } else {
      finalMsg += '\n\n' + inclusionsText;
    }
  }

  // Inject discount if not in template
  if (!template.includes('[قيمة_الخصم]') && discountText) {
    const splitPoint = finalMsg.indexOf('إجمالي المبلغ:');
    if (splitPoint !== -1) {
      finalMsg = finalMsg.slice(0, splitPoint) + discountText + '\n' + finalMsg.slice(splitPoint);
    }
  }

  // Inject additions if not in template
  if (!template.includes('[تفاصيل_الإضافات]') && additionsText) {
    const splitPoint = finalMsg.indexOf('إجمالي المبلغ:');
    if (splitPoint !== -1) {
      finalMsg = finalMsg.slice(0, splitPoint) + additionsText + '\n\n' + finalMsg.slice(splitPoint);
    } else {
      finalMsg += '\n\n' + additionsText;
    }
  }

  const encodedMsg = encodeURIComponent(finalMsg);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  window.open(waUrl, '_blank');
  return true;
}
