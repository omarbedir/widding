import type { Hall, Booking } from '../types';
import { formatCurrency } from '../utils/dateUtils';
import { openWhatsAppBooking } from '../utils/whatsapp';
import confetti from 'canvas-confetti';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  halls: Hall[];
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onConfirmStatus: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  halls,
  onEdit,
  onDelete,
  onConfirmStatus,
}) => {
  if (!isOpen || !booking) return null;

  const hall = halls.find((h) => h.id === booking.hallId);
  const hallName = hall ? hall.name : 'قاعة غير معروفة';

  const handleWhatsApp = () => {
    openWhatsAppBooking(booking, hallName);
  };

  const handleConfirmFinal = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onConfirmStatus(booking);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-6 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 sm:top-4 left-3 sm:left-4 text-slate-400 hover:text-slate-200 text-base sm:text-lg w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition cursor-pointer z-10"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Title */}
        <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-3 sm:mb-4 flex items-center gap-2 shrink-0">
          <i className="fa-solid fa-circle-info"></i>
          <span>بيانات حجز اليوم</span>
        </h3>

        <div className="overflow-y-auto flex-1 pr-1 pl-1 space-y-3">

          {/* Details Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs sm:text-sm text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">اسم العريس:</span>
              <span className="font-extrabold text-slate-100 text-sm sm:text-base">
                {booking.groomName}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">تاريخ المناسبة:</span>
              <span className="font-bold text-amber-400 font-mono">{booking.date}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">القاعة المحجوزة:</span>
              <span className="font-bold text-amber-300">{hallName}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">رقم الهاتف:</span>
              <span className="font-mono text-slate-200" dir="ltr">
                {booking.phone}
              </span>
            </div>

            {booking.secondaryPhone && (
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-semibold">رقم هاتف آخر:</span>
                <span className="font-mono text-slate-200" dir="ltr">
                  {booking.secondaryPhone}
                </span>
              </div>
            )}

            {booking.recommendation && (
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-semibold">بتوصية:</span>
                <span className="font-bold text-amber-300">{booking.recommendation}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">المبلغ الكلي:</span>
              <span className="font-bold text-slate-100">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">المدفوع (العربون):</span>
              <span className="font-bold text-emerald-400">
                {formatCurrency(booking.paidAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">المتبقي:</span>
              <span
                className={`font-black text-sm sm:text-base ${booking.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
              >
                {formatCurrency(booking.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {booking.notes && (
            <div className="mt-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block font-semibold mb-1 text-xs">
                ملاحظات:
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">{booking.notes}</p>
            </div>
          )}

          {/* WhatsApp Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp text-base"></i>
              <span>إرسال رسالة واتساب للعريس</span>
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-3 flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-800 shrink-0">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleConfirmFinal}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>تأكيد الحجز النهائي</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(booking)}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition border border-amber-500/20 cursor-pointer"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>تعديل البيانات</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(booking)}
                className="text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition border border-rose-500/20 cursor-pointer"
              >
                <i className="fa-solid fa-trash"></i>
                <span>حذف الحجز</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
