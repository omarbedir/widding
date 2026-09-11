import React, { useState, useEffect } from 'react';
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
  onAddPayment?: (bookingId: string, amount: number) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  halls,
  onEdit,
  onDelete,
  onConfirmStatus,
  onAddPayment,
}) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      setShowAddPayment(false);
      setPaymentAmount('');
    }
  }, [isOpen, booking?.id]);

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

  const numericPayment = typeof paymentAmount === 'number' ? paymentAmount : 0;
  const isPaymentExceeding = booking.remainingAmount > 0 && numericPayment > booking.remainingAmount;
  const newCalculatedPaid = booking.paidAmount + numericPayment;
  const newCalculatedRemaining = Math.max(0, booking.remainingAmount - numericPayment);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = typeof paymentAmount === 'number' ? paymentAmount : 0;
    if (amount <= 0 || isPaymentExceeding) return;

    if (onAddPayment) {
      onAddPayment(booking.id, amount);
    }

    if (booking.remainingAmount - amount <= 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setShowAddPayment(false);
    setPaymentAmount('');
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
                className={`font-black text-sm sm:text-base ${
                  booking.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {formatCurrency(booking.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Add Payment Interactive Section */}
          {showAddPayment && (
            <form
              onSubmit={handleSavePayment}
              className="bg-slate-950 p-4 rounded-xl border border-emerald-500/50 space-y-3 animate-in fade-in zoom-in-95 duration-150 shadow-xl shadow-emerald-950/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs sm:text-sm">
                  <i className="fa-solid fa-hand-holding-dollar text-base"></i>
                  <span>إضافة دفعة مالية جديدة</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPayment(false);
                    setPaymentAmount('');
                  }}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  المبلغ المراد إضافته (ج.م) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max={booking.remainingAmount > 0 ? booking.remainingAmount : undefined}
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    placeholder="مثال: 5000"
                    className={`w-full bg-slate-900 border text-emerald-400 font-black text-sm sm:text-base rounded-xl p-2.5 pl-10 focus:outline-none transition font-mono ${
                      isPaymentExceeding
                        ? 'border-rose-500 text-rose-400 focus:border-rose-400'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                    autoFocus
                  />
                  <span className="absolute left-3 top-2.5 sm:top-3 text-xs text-slate-500 font-bold">
                    ج.م
                  </span>
                </div>
              </div>

              {/* Error banner if payment exceeds remaining amount */}
              {isPaymentExceeding && (
                <div className="text-rose-400 text-xs font-bold bg-rose-950/40 border border-rose-500/40 p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                  <i className="fa-solid fa-triangle-exclamation text-sm shrink-0"></i>
                  <span>
                    تنبيه: لا يمكن إضافة مبلغ أكبر من المبلغ المتبقي ({formatCurrency(booking.remainingAmount)})
                  </span>
                </div>
              )}

              {/* Quick shortcut presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {booking.remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(booking.remainingAmount)}
                    className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition cursor-pointer"
                  >
                    كامل المتبقي ({formatCurrency(booking.remainingAmount)})
                  </button>
                )}
                {[1000, 2000, 5000, 10000].map((val) => {
                  if (booking.remainingAmount > 0 && val > booking.remainingAmount) return null;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPaymentAmount(val)}
                      className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg bg-slate-850 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                    >
                      +{val.toLocaleString('ar-EG')} ج.م
                    </button>
                  );
                })}
              </div>

              {/* Live financial preview */}
              {numericPayment > 0 && !isPaymentExceeding && (
                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>إجمالي المدفوع الجديد:</span>
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                      {formatCurrency(newCalculatedPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>المتبقي الجديد بعد الإضافة:</span>
                    <span
                      className={`font-black text-xs sm:text-sm ${
                        newCalculatedRemaining === 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(newCalculatedRemaining)}
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm payment button */}
              <button
                type="submit"
                disabled={numericPayment <= 0 || isPaymentExceeding}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>تأكيد وحفظ الدفعة</span>
              </button>
            </form>
          )}

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
                onClick={() => setShowAddPayment((prev) => !prev)}
                className={`font-bold text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl transition border cursor-pointer active:scale-95 ${
                  showAddPayment
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
                }`}
              >
                <i className="fa-solid fa-hand-holding-dollar"></i>
                <span>إضافة مبلغ</span>
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
