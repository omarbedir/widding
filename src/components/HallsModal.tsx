import { useState } from 'react';
import type { Hall, Booking } from '../types';

interface HallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  halls: Hall[];
  bookings: Booking[];
  onSaveHall: (hallData: { id?: string; name: string; capacity: number; price?: number; inclusions?: string }) => void;
  onDeleteHall: (hall: Hall) => void;
}

export const HallsModal: React.FC<HallsModalProps> = ({
  isOpen,
  onClose,
  halls,
  bookings,
  onSaveHall,
  onDeleteHall,
}) => {
  const [editingHallId, setEditingHallId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [inclusions, setInclusions] = useState('');

  if (!isOpen) return null;

  const handleEditClick = (hall: Hall) => {
    setEditingHallId(hall.id);
    setName(hall.name);
    setCapacity(hall.capacity);
    setPrice(hall.price || '');
    setInclusions(hall.inclusions || '');
  };

  const handleCancelEdit = () => {
    setEditingHallId(null);
    setName('');
    setCapacity('');
    setPrice('');
    setInclusions('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveHall({
      id: editingHallId || undefined,
      name: name.trim(),
      capacity: Number(capacity) || 300,
      price: Number(price) || 0,
      inclusions: inclusions.trim(),
    });

    handleCancelEdit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-6 relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 text-lg w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-4 flex items-center gap-2 shrink-0">
          <i className="fa-solid fa-building-user"></i>
          <span>إدارة القاعات</span>
        </h3>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 pr-1 pl-1 space-y-6">
          {/* Current Halls List */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-3 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>القاعات الحالية</span>
              <span className="text-xs text-amber-400 font-semibold">
                ({halls.length} قاعة مسجلة)
              </span>
            </h4>

            <div className="space-y-2.5">
              {halls.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">
                  لا توجد قاعات مسجلة حالياً.
                </p>
              ) : (
                halls.map((hall) => {
                  const hallBookingsCount = bookings.filter(
                    (b) => b.hallId === hall.id
                  ).length;
                  const isCurrentlyEditing = editingHallId === hall.id;

                  return (
                    <div
                      key={hall.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition border ${
                        isCurrentlyEditing
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-200 text-sm">
                          {hall.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          السعة: {hall.capacity} فرد | السعر: {hall.price || 0} جنيه | إجمالي الحجوزات: {hallBookingsCount}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(hall)}
                          className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center justify-center transition cursor-pointer"
                          title="تعديل بيانات القاعة"
                        >
                          <i className="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteHall(hall)}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition cursor-pointer"
                          title="حذف القاعة"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add / Edit Hall Form */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i
                  className={`fa-solid ${
                    editingHallId ? 'fa-pen-to-square' : 'fa-plus'
                  } text-amber-500`}
                ></i>
                <span>{editingHallId ? 'تعديل بيانات القاعة' : 'إضافة قاعة جديدة'}</span>
              </span>
              {editingHallId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  اسم القاعة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: قاعة اللؤلؤة"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  السعة التقريبية (أفراد) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="مثال: 300"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  سعر الحجز (جنيه) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="مثال: 5000"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  مشتملات القاعة (كل بند في سطر)
                </label>
                <textarea
                  value={inclusions}
                  onChange={(e) => setInclusions(e.target.value)}
                  placeholder="مثال:&#10;500 كرسي&#10;دي جي&#10;كوشة"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition leading-relaxed resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition font-semibold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition text-xs shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  {editingHallId ? 'حفظ التعديلات' : 'إضافة القاعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
