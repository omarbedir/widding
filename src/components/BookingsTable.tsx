import React, { useState } from 'react';
import type { Hall, Booking, AppUser } from '../types';
import { formatCurrency, formatDateStr } from '../utils/dateUtils';
import { resolveBookingOwnerName } from '../utils/userUtils';

interface BookingsTableProps {
  halls: Hall[];
  bookings: Booking[];
  selectedHallId: string;
  users?: AppUser[];
  onOpenDetailsModal: (bookingId: string) => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  halls,
  bookings,
  selectedHallId,
  users,
  onOpenDetailsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const todayStr = formatDateStr(new Date());

  const getHallName = (hallId: string) => {
    const h = halls.find((x) => x.id === hallId);
    return h ? h.name : 'قاعة غير معروفة';
  };

  const filteredBookings = bookings
    .filter((b) => {
      // إذا انقضى يوم الحجز ولم يتبق أي مبلغ على العريس، لا يتم إظهار الحجز في هذا السجل
      const isPast = b.date < todayStr;
      const isPaidInFull =
        (b.remainingAmount ?? 0) <= 0 ||
        (b.totalAmount > 0 && (b.paidAmount ?? 0) >= b.totalAmount);

      if (isPast && isPaidInFull) {
        return false;
      }

      const matchesHall =
        selectedHallId === 'all' || b.hallId === selectedHallId;
      const q = searchQuery.toLowerCase().trim();
      const ownerName = resolveBookingOwnerName(b, users).toLowerCase();
      const matchesSearch =
        !q ||
        b.groomName.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        ownerName.includes(q) ||
        (b.secondaryPhone && b.secondaryPhone.includes(q)) ||
        (b.recommendation && b.recommendation.toLowerCase().includes(q));
      return matchesHall && matchesSearch;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-list-check text-amber-400 text-base sm:text-lg"></i>
          <h2 className="text-xs sm:text-base font-bold text-slate-100">
            سجل حجوزات القاعة ({filteredBookings.length})
          </h2>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم العريس أو الهاتف أو المسؤول..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl pr-9 pl-4 py-2 sm:py-2.5 focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500"
            />
            <i className="fa-solid fa-magnifying-glass absolute right-3 top-2.5 sm:top-3 text-slate-500 text-xs"></i>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2 sm:top-2.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 -mx-1 sm:mx-0">
        <table className="w-full text-right text-xs sm:text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] sm:text-xs text-amber-400 border-b border-slate-800 font-bold uppercase">
            <tr>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">التاريخ</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">اسم العريس</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">المسؤول عن الحجز</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">القاعة</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">الهاتف</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">المبلغ الكلي</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">المدفوع</th>
              <th className="p-2.5 sm:p-3.5 whitespace-nowrap">المتبقي</th>
              <th className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <i className="fa-solid fa-calendar-xmark text-xl sm:text-2xl text-slate-600"></i>
                    <span>لا توجد حجوزات مسجلة لهذه القاعة أو مطابقة للبحث</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-slate-800/40 transition cursor-default"
                >
                  <td className="p-2.5 sm:p-3.5 font-bold text-amber-300 whitespace-nowrap">
                    {b.date}
                  </td>
                  <td className="p-2.5 sm:p-3.5 font-bold text-slate-100 whitespace-nowrap">
                    {b.groomName}
                  </td>
                  <td className="p-2.5 sm:p-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                      <i className="fa-solid fa-user-check text-[10px] text-amber-400"></i>
                      <span>{resolveBookingOwnerName(b, users)}</span>
                    </span>
                  </td>
                  <td className="p-2.5 sm:p-3.5 text-amber-400 font-semibold whitespace-nowrap">
                    {getHallName(b.hallId)}
                  </td>
                  <td
                    className="p-2.5 sm:p-3.5 font-mono text-slate-300 text-left whitespace-nowrap text-xs"
                    dir="ltr"
                  >
                    {b.phone}
                  </td>
                  <td className="p-2.5 sm:p-3.5 font-bold text-slate-200 whitespace-nowrap">
                    {formatCurrency(b.totalAmount)}
                  </td>
                  <td className="p-2.5 sm:p-3.5 text-emerald-400 font-semibold whitespace-nowrap">
                    {formatCurrency(b.paidAmount)}
                  </td>
                  <td
                    className={`p-2.5 sm:p-3.5 font-bold whitespace-nowrap ${
                      b.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(b.remainingAmount)}
                  </td>
                  <td className="p-2.5 sm:p-3.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenDetailsModal(b.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-slate-700 active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      عرض / إجراءات
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
