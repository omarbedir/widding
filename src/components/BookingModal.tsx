import { useState, useEffect } from 'react';
import type { Hall, Booking } from '../types';
import { formatDateStr } from '../utils/dateUtils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Omit<Booking, 'id' | 'created_at'> & { id?: string }) => void;
  halls: Hall[];
  initialDate?: string;
  initialHallId?: string;
  editBooking?: Booking | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  halls,
  initialDate,
  initialHallId,
  editBooking,
}) => {
  const [groomName, setGroomName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [hallId, setHallId] = useState('');
  const [date, setDate] = useState('');
  const [baseHallPrice, setBaseHallPrice] = useState<number>(0);
  const [additionalServicesAmount, setAdditionalServicesAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editBooking) {
        setGroomName(editBooking.groomName || '');
        setPhone(editBooking.phone || '');
        setSecondaryPhone(editBooking.secondaryPhone || '');
        setRecommendation(editBooking.recommendation || '');
        setHallId(editBooking.hallId || (halls[0]?.id || ''));
        setDate(editBooking.date || formatDateStr(new Date()));
        const existingBasePrice = (editBooking.totalAmount || 0) - (editBooking.additionalServicesAmount || 0);
        setBaseHallPrice(existingBasePrice);
        setAdditionalServicesAmount(editBooking.additionalServicesAmount || '');
        setPaidAmount(editBooking.paidAmount || '');
        setNotes(editBooking.notes || '');
      } else {
        setGroomName('');
        setPhone('');
        setSecondaryPhone('');
        setRecommendation('');
        const initHall = initialHallId || (halls[0]?.id || '');
        setHallId(initHall);
        setDate(initialDate || formatDateStr(new Date()));
        const hallObj = halls.find(h => h.id === initHall);
        setBaseHallPrice(hallObj?.price || 0);
        setAdditionalServicesAmount('');
        setPaidAmount('');
        setNotes('');
      }
    }
  }, [isOpen, editBooking, initialDate, initialHallId, halls]);

  const handleHallChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHallId = e.target.value;
    setHallId(newHallId);
    const hallObj = halls.find(h => h.id === newHallId);
    if (hallObj && hallObj.price !== undefined) {
      setBaseHallPrice(hallObj.price);
    }
  };

  if (!isOpen) return null;

  const additionalNum = typeof additionalServicesAmount === 'number' ? additionalServicesAmount : 0;
  const totalNum = baseHallPrice + additionalNum;
  const paidNum = typeof paidAmount === 'number' ? paidAmount : 0;
  const remainingAmount = Math.max(0, totalNum - paidNum);

  const selectedHall = halls.find((h) => h.id === hallId);
  const modalTitle = editBooking
    ? 'تعديل بيانات الحجز'
    : selectedHall
      ? `تسجيل حجز جديد - ${selectedHall.name}`
      : 'تسجيل حجز جديد';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      id: editBooking ? editBooking.id : undefined,
      groomName: groomName.trim() || 'بدون اسم',
      phone: phone.trim() || 'غير مدخل',
      secondaryPhone: secondaryPhone.trim(),
      recommendation: recommendation.trim(),
      hallId: hallId || halls[0]?.id || '',
      date: date || formatDateStr(new Date()),
      totalAmount: totalNum,
      paidAmount: paidNum,
      remainingAmount,
      additionalServicesAmount: additionalNum,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-6 relative flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
            <i className={`fa-solid ${editBooking ? 'fa-pen-to-square' : 'fa-calendar-plus'}`}></i>
            <span>{modalTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0 pt-3">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pl-1 text-xs sm:text-sm">
            {/* Groom Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                اسم العريس / العروس <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition"
              />
            </div>

            {/* Phones (2 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  رقم الهاتف الرئيسي <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPhone(val);
                  }}
                  placeholder="01xxxxxxxxx"
                  pattern="[0-9]{11}"
                  title="يجب أن يتكون رقم الهاتف من 11 رقماً"
                  maxLength={11}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  رقم تليفون آخر
                </label>
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setSecondaryPhone(val);
                  }}
                  placeholder="01xxxxxxxxx"
                  pattern="[0-9]{11}"
                  title="يجب أن يتكون رقم الهاتف من 11 رقماً"
                  maxLength={11}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Hall & Recommendation (2 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  القاعة المحجوزة
                </label>
                <select
                  value={hallId}
                  onChange={handleHallChange}
                  className="w-full bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition cursor-pointer"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  بتوصية
                </label>
                <input
                  type="text"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="اسم الشخص أو جهة التوصية"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                تاريخ الحجز <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition"
              />
            </div>

            {/* Price Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs sm:text-sm">
                  سعر القاعة الأساسي
                </label>
                <input
                  type="number"
                  readOnly
                  value={baseHallPrice}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl p-2.5 text-center cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs sm:text-sm">
                  مبلغ خدمات إضافية
                </label>
                <input
                  type="number"
                  min="0"
                  value={additionalServicesAmount}
                  onChange={(e) =>
                    setAdditionalServicesAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="مثال: 1500"
                  className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition text-center"
                />
              </div>
            </div>

            {/* Financials Summary */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  المبلغ الكلي (الإجمالي)
                </label>
                <input
                  type="number"
                  readOnly
                  value={totalNum}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl p-2.5 text-center cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  المتبقي
                </label>
                <input
                  type="number"
                  readOnly
                  value={remainingAmount}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-rose-400 font-bold rounded-xl p-2.5 text-center cursor-not-allowed"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                ملاحظات إضافية
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي تفاصيل خاصة بالبوفيه، الكوشة، الديكور..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition resize-none"
              ></textarea>
            </div>
          </div>

          {/* Action Footer */}
          <div className="shrink-0 pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5 bg-slate-900 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <i className="fa-solid fa-right-from-bracket text-amber-400"></i>
              <span>خروج / إلغاء</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-yellow-500 hover:from-emerald-400 hover:to-yellow-400 text-slate-950 font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <i className="fa-solid fa-circle-check text-sm"></i>
              <span>{editBooking ? 'حفظ التعديلات' : 'تأكيد الحجز والتعاقد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
