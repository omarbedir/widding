import React, { useState, useEffect } from 'react';
import type { Hall, Booking, AppUser } from '../types';
import { formatCurrency } from '../utils/dateUtils';
import { openWhatsAppBooking } from '../utils/whatsapp';
import { resolveBookingOwnerName } from '../utils/userUtils';
import confetti from 'canvas-confetti';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  halls: Hall[];
  users?: AppUser[];
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onAddPayment?: (bookingId: string, amount: number) => void;
  onUpdateBookingDirect?: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  halls,
  users,
  onEdit,
  onDelete,
  onAddPayment,
  onUpdateBookingDirect,
}) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');

  const [showAdditions, setShowAdditions] = useState(false);
  const [additionName, setAdditionName] = useState('');
  const [additionPrice, setAdditionPrice] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      setShowAddPayment(false);
      setPaymentAmount('');
      setShowDiscount(false);
      setDiscountAmount('');
      setShowAdditions(false);
      setAdditionName('');
      setAdditionPrice('');
    }
  }, [isOpen, booking?.id]);

  if (!isOpen || !booking) return null;

  const hall = halls.find((h) => h.id === booking.hallId);
  const hallName = hall ? hall.name : 'قاعة غير معروفة';

  const handleWhatsApp = () => {
    openWhatsAppBooking(booking, hall);
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

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = typeof discountAmount === 'number' ? discountAmount : 0;
    if (amount <= 0 || !onUpdateBookingDirect) return;
    
    const newTotalAmount = Math.max(0, booking.totalAmount - amount);
    const newRemainingAmount = Math.max(0, newTotalAmount - booking.paidAmount);
    
    onUpdateBookingDirect({
      ...booking,
      discount: (booking.discount || 0) + amount,
      totalAmount: newTotalAmount,
      remainingAmount: newRemainingAmount,
    });
    
    setShowDiscount(false);
    setDiscountAmount('');
  };

  const handleSaveAddition = (e: React.FormEvent) => {
    e.preventDefault();
    const price = typeof additionPrice === 'number' ? additionPrice : 0;
    if (price <= 0 || !additionName.trim() || !onUpdateBookingDirect) return;
    
    const newAddition = { id: 'add-' + Date.now(), name: additionName.trim(), price };
    const newTotalAmount = booking.totalAmount + price;
    const newAdditionalServicesAmount = (booking.additionalServicesAmount || 0) + price;
    const newRemainingAmount = newTotalAmount - booking.paidAmount;
    
    onUpdateBookingDirect({
      ...booking,
      additions: [...(booking.additions || []), newAddition],
      totalAmount: newTotalAmount,
      additionalServicesAmount: newAdditionalServicesAmount,
      remainingAmount: newRemainingAmount,
    });
    
    setShowAdditions(false);
    setAdditionName('');
    setAdditionPrice('');
  };

  return (
    <>
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
          {/* Top Actions Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp text-base"></i>
              <span>إرسال رسالة واتساب للعريس</span>
            </button>
            
            <button
              type="button"
              onClick={() => onDelete(booking)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
              title="حذف الحجز"
            >
              <i className="fa-solid fa-trash"></i>
              <span className="hidden sm:inline">حذف الحجز</span>
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-800 shrink-0">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                onClick={() => { setShowAdditions((prev) => !prev); setShowAddPayment(false); setShowDiscount(false); }}
                className={`font-bold text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl transition border cursor-pointer active:scale-95 ${
                  showAdditions
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20'
                }`}
              >
                <i className="fa-solid fa-plus-square"></i>
                <span>إضافات</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowDiscount((prev) => !prev); setShowAddPayment(false); setShowAdditions(false); }}
                className={`font-bold text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl transition border cursor-pointer active:scale-95 ${
                  showDiscount
                    ? 'bg-violet-500 text-white border-violet-400 shadow-md shadow-violet-500/20'
                    : 'text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20'
                }`}
              >
                <i className="fa-solid fa-tags"></i>
                <span>خصم</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(booking)}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition border border-amber-500/20 cursor-pointer"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>تعديل البيانات</span>
              </button>
            </div>

          </div>

          {/* Details Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs sm:text-sm text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">اسم العريس:</span>
              <span className="font-extrabold text-slate-100 text-sm sm:text-base">
                {booking.groomName}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">المسؤول عن تسجيل الحجز:</span>
              <span className="font-bold text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs sm:text-sm">
                <i className="fa-solid fa-user-check text-amber-400 text-xs"></i>
                <span>{resolveBookingOwnerName(booking, users)}</span>
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
              <span className="text-slate-400 font-semibold">سعر القاعة الأساسي:</span>
              <span className="font-bold text-slate-200">
                {formatCurrency((booking.totalAmount || 0) - (booking.additionalServicesAmount || 0) + (booking.discount || 0))}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">مبلغ خدمات إضافية:</span>
              <span className="font-bold text-slate-200">
                {formatCurrency(booking.additionalServicesAmount || 0)}
              </span>
            </div>

            {booking.discount && booking.discount > 0 && (
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-semibold">قيمة الخصم:</span>
                <span className="font-bold text-violet-400">
                  {formatCurrency(booking.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">المبلغ الكلي (الإجمالي):</span>
              <span className="font-bold text-amber-400">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-semibold">إجمالي المدفوع:</span>
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

          {/* Additions list */}
          {(booking.additions && booking.additions.length > 0) && (
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-xs sm:text-sm">
              <h4 className="font-bold text-indigo-400 mb-2 border-b border-indigo-500/20 pb-1.5 flex gap-1.5 items-center">
                <i className="fa-solid fa-plus-square"></i>
                الخدمات الإضافية المسجلة
              </h4>
              <div className="space-y-1.5 mt-2">
                {booking.additions.map((add, idx) => (
                  <div key={add.id} className="flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-md font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 font-medium text-xs sm:text-sm">
                        {add.name}
                      </span>
                    </div>
                    <span className="font-bold text-indigo-400 text-xs sm:text-sm">
                      {formatCurrency(add.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          {(booking.payments && booking.payments.length > 0) && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-xs sm:text-sm">
              <h4 className="font-bold text-emerald-400 mb-2 border-b border-slate-700/50 pb-1.5 flex gap-1.5 items-center">
                <i className="fa-solid fa-clock-rotate-left"></i>
                سجل الدفعات المالية
              </h4>
              <div className="space-y-1.5 mt-2">
                {booking.payments.map((payment, idx) => {
                  const dateObj = new Date(payment.date);
                  const formattedDate = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' - ' + dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={payment.id} className="flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-700/30 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-md font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 font-medium text-xs sm:text-sm">
                          {payment.description || `الدفعة ${idx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400 text-xs sm:text-sm">{formatCurrency(payment.amount)}</span>
                        <span className="text-slate-500 text-[10px] sm:text-xs" dir="ltr">{formattedDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            {/* Add Payment Interactive Section - MOVED TO SEPARATE MODAL OUTSIDE */}

            {/* Notes if any */}
            {booking.notes && (
              <div className="mt-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block font-semibold mb-1 text-xs">
                  ملاحظات:
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Interactive Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm">
            <form
              onSubmit={handleSavePayment}
              className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/50 space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl shadow-emerald-950/20"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm sm:text-base">
                  <i className="fa-solid fa-hand-holding-dollar text-lg"></i>
                  <span>إضافة دفعة مالية جديدة</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPayment(false);
                    setPaymentAmount('');
                  }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 text-sm rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 text-xs sm:text-sm">
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
                    className={`w-full bg-slate-950 border text-emerald-400 font-black text-base sm:text-lg rounded-xl p-3 pl-12 focus:outline-none transition font-mono ${
                      isPaymentExceeding
                        ? 'border-rose-500 text-rose-400 focus:border-rose-400'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                    autoFocus
                  />
                  <span className="absolute left-3 top-3.5 text-sm text-slate-500 font-bold">
                    ج.م
                  </span>
                </div>
              </div>

              {/* Error banner if payment exceeds remaining amount */}
              {isPaymentExceeding && (
                <div className="text-rose-400 text-xs font-bold bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                  <i className="fa-solid fa-triangle-exclamation text-sm shrink-0 mt-0.5"></i>
                  <span className="leading-relaxed">
                    لا يمكن إضافة مبلغ أكبر من المبلغ المتبقي ({formatCurrency(booking.remainingAmount)})
                  </span>
                </div>
              )}

              {/* Quick shortcut presets */}
              <div className="flex flex-wrap gap-2 items-center">
                {booking.remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(booking.remainingAmount)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition cursor-pointer"
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
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                    >
                      +{val.toLocaleString('ar-EG')} ج.م
                    </button>
                  );
                })}
              </div>

              {/* Live financial preview */}
              {numericPayment > 0 && !isPaymentExceeding && (
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 text-xs space-y-2 font-medium shadow-inner">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>إجمالي المدفوع الجديد:</span>
                    <span className="font-bold text-emerald-400 sm:text-sm">
                      {formatCurrency(newCalculatedPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>المتبقي الجديد بعد الإضافة:</span>
                    <span
                      className={`font-black sm:text-sm ${
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
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>تأكيد وحفظ الدفعة</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Discount Interactive Modal */}
      {showDiscount && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm">
            <form
              onSubmit={handleSaveDiscount}
              className="bg-slate-900 p-5 rounded-2xl border border-violet-500/50 space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl shadow-violet-950/20"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-violet-400 font-extrabold text-sm sm:text-base">
                  <i className="fa-solid fa-tags text-lg"></i>
                  <span>إضافة خصم</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscount(false);
                    setDiscountAmount('');
                  }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 text-sm rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 text-xs sm:text-sm">
                  قيمة الخصم (ج.م) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    placeholder="مثال: 500"
                    className="w-full bg-slate-950 border border-slate-700 text-violet-400 font-black text-base sm:text-lg rounded-xl p-3 pl-12 focus:border-violet-500 focus:outline-none transition font-mono"
                    autoFocus
                  />
                  <span className="absolute left-3 top-3.5 text-sm text-slate-500 font-bold">
                    ج.م
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!discountAmount}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-extrabold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm active:scale-95 shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                <i className="fa-solid fa-check"></i>
                <span>تطبيق الخصم</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Additions Interactive Modal */}
      {showAdditions && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm">
            <form
              onSubmit={handleSaveAddition}
              className="bg-slate-900 p-5 rounded-2xl border border-indigo-500/50 space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl shadow-indigo-950/20"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm sm:text-base">
                  <i className="fa-solid fa-plus-square text-lg"></i>
                  <span>تسجيل خدمة إضافية</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdditions(false);
                    setAdditionName('');
                    setAdditionPrice('');
                  }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 text-sm rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 text-xs sm:text-sm">
                  اسم الإضافة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={additionName}
                  onChange={(e) => setAdditionName(e.target.value)}
                  placeholder="مثال: ليزر إضافي"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-bold text-sm rounded-xl p-3 focus:border-indigo-500 focus:outline-none transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 text-xs sm:text-sm">
                  سعر الإضافة (ج.م) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    value={additionPrice}
                    onChange={(e) =>
                      setAdditionPrice(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    placeholder="مثال: 1500"
                    className="w-full bg-slate-950 border border-slate-700 text-indigo-400 font-black text-base sm:text-lg rounded-xl p-3 pl-12 focus:border-indigo-500 focus:outline-none transition font-mono"
                  />
                  <span className="absolute left-3 top-3.5 text-sm text-slate-500 font-bold">
                    ج.م
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!additionPrice || !additionName.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-extrabold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm active:scale-95 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                <i className="fa-solid fa-check"></i>
                <span>حفظ الخدمة الإضافية</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
