import type { Booking } from '../types';

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

export function openWhatsAppBooking(booking: Booking, hallName: string): boolean {
  const cleanPhone = formatPhoneForWhatsApp(booking.phone);
  if (!cleanPhone) {
    return false;
  }

  const finalMsg = `🎉 أهلاً بحضرتك يا عريسنا الغالي / أ/ ${booking.groomName}

يسعدنا ويشرفنا اختياركم لـ (قاعات نادي اجوان) لنحتفل معاً بأجمل ليلة في العمر! 💍✨

📋 نؤكد لحضرتك تفاصيل الحجز:
🏛️ القاعة: ${hallName}
📅 تاريخ المناسبة: ${booking.date}
💰 إجمالي المبلغ: ${booking.totalAmount.toLocaleString()} ج.م
💵 المبلغ المدفوع (العربون): ${booking.paidAmount.toLocaleString()} ج.م
💳 المبلغ المتبقي: ${booking.remainingAmount.toLocaleString()} ج.م
${booking.notes ? `📝 ملاحظات: ${booking.notes}\n` : ''}
نتمنى لكم حفل زفاف أسطوري ومليء بالفرح والبهجة! ✨
لأية استفسارات إضافية بخصوص البوفيه، الكوشة، الديكور، أو الترتيبات نحن في خدمتكم دائماً. 🤍`;

  const encodedMsg = encodeURIComponent(finalMsg);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  window.open(waUrl, '_blank');
  return true;
}
