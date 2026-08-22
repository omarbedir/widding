import React from 'react';
import type { Hall, Booking } from '../types';
import {
  ARABIC_MONTH_NAMES,
  ARABIC_WEEK_HEADERS,
  formatDateStr,
} from '../utils/dateUtils';

interface MonthlyCalendarProps {
  halls: Hall[];
  bookings: Booking[];
  selectedHallId: string;
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToCurrentMonth: () => void;
  onOpenBookingModal: (dateStr: string, hallId?: string) => void;
  onOpenDetailsModal: (bookingId: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  halls,
  bookings,
  selectedHallId,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onGoToCurrentMonth,
  onOpenBookingModal,
  onOpenDetailsModal,
}) => {
  const todayObj = new Date();
  const todayStr = formatDateStr(todayObj);

  const getHallName = (hallId: string) => {
    const h = halls.find((x) => x.id === hallId);
    return h ? h.name : 'قاعة غير معروفة';
  };

  const selectedHall = halls.find((h) => h.id === selectedHallId);
  const addBtnText =
    selectedHallId === 'all'
      ? 'حجز جديد'
      : `حجز جديد (${selectedHall ? selectedHall.name : ''})`;

  // Calculate calendar grid
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 1) % 7;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDayIndex });
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, idx) => idx + 1);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-6 shadow-2xl relative">
      {/* Calendar Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-800">
        {/* Month Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center transition shadow-md active:scale-95 cursor-pointer shrink-0"
            title="الشهر السابق"
          >
            <i className="fa-solid fa-chevron-right text-xs sm:text-sm"></i>
          </button>

          <div className="bg-slate-950/60 border border-slate-800 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl flex-1 sm:flex-initial">
            <h2 className="text-sm sm:text-lg font-extrabold text-amber-400 text-center min-w-[120px] sm:min-w-[150px]">
              {ARABIC_MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
          </div>

          <button
            type="button"
            onClick={onNextMonth}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center transition shadow-md active:scale-95 cursor-pointer shrink-0"
            title="الشهر القادم"
          >
            <i className="fa-solid fa-chevron-left text-xs sm:text-sm"></i>
          </button>

          <button
            type="button"
            onClick={onGoToCurrentMonth}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-slate-300 font-bold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-calendar-day text-amber-400"></i>
            <span className="hidden xs:inline">الشهر الحالي</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Legend Status Indicators */}
          <div className="flex items-center gap-2.5 text-[10px] sm:text-xs bg-slate-950/50 border border-slate-800 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className="text-emerald-400 font-semibold">متاح</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
              <span className="text-rose-400 font-semibold">محجوز</span>
            </div>
          </div>

          {/* Add Booking Button */}
          <button
            type="button"
            onClick={() =>
              onOpenBookingModal(
                '',
                selectedHallId !== 'all' ? selectedHallId : undefined
              )
            }
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span className="truncate">{addBtnText}</span>
          </button>
        </div>
      </div>

      {/* Days of week headers (Sat -> Fri) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3 text-center text-slate-300 font-extrabold text-[10px] sm:text-sm">
        {ARABIC_WEEK_HEADERS.map((header, idx) => {
          const isWeekend = idx === 0 || idx === 5 || idx === 6; // Sat, Thu, Fri
          return (
            <div
              key={header}
              className={`py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border ${
                isWeekend
                  ? 'bg-slate-950/80 border-slate-800/80 text-amber-400 shadow-inner'
                  : 'bg-slate-950/60 border-slate-800/60 text-slate-300'
              }`}
            >
              {header}
            </div>
          );
        })}
      </div>

      {/* Dynamic Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
        {/* Leading empty cells */}
        {emptyCells.map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square min-h-[54px] xs:min-h-[64px] sm:min-h-[110px] bg-slate-950/20 rounded-xl sm:rounded-2xl border border-dashed border-slate-800/30 opacity-20 pointer-events-none"
          />
        ))}

        {/* Month day tiles */}
        {monthDays.map((day) => {
          const dateObj = new Date(currentYear, currentMonth, day);
          const dateStr = formatDateStr(dateObj);
          const isToday = dateStr === todayStr;

          const dayBookings = bookings.filter((b) => {
            const matchesHall =
              selectedHallId === 'all' || b.hallId === selectedHallId;
            return matchesHall && b.date === dateStr;
          });

          const isBooked = dayBookings.length > 0;
          const firstBooking = dayBookings[0];

          return (
            <div
              key={dateStr}
              onClick={() => {
                if (isBooked && firstBooking) {
                  onOpenDetailsModal(firstBooking.id);
                } else {
                  onOpenBookingModal(
                    dateStr,
                    selectedHallId !== 'all' ? selectedHallId : undefined
                  );
                }
              }}
              className={`aspect-square min-h-[54px] xs:min-h-[64px] sm:min-h-[115px] rounded-xl sm:rounded-2xl p-1.5 sm:p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between border relative overflow-hidden group hover:-translate-y-0.5 ${
                isBooked
                  ? 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-rose-900/40 border-rose-500/60 text-rose-100 shadow-lg shadow-rose-950/40 hover:border-rose-400 hover:shadow-rose-900/60'
                  : 'bg-gradient-to-br from-emerald-950/50 via-slate-900 to-emerald-900/20 border-emerald-500/40 text-emerald-100 shadow-md shadow-emerald-950/20 hover:border-emerald-400 hover:shadow-emerald-900/40'
              } ${
                isToday
                  ? 'ring-2 ring-amber-400 ring-offset-1 sm:ring-offset-2 ring-offset-slate-900 scale-[1.02] z-10'
                  : ''
              }`}
            >
              {/* Day Number and Badges Header */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-sm xs:text-base sm:text-2xl font-black tracking-tight ${
                    isBooked ? 'text-rose-100' : 'text-slate-100'
                  }`}
                >
                  {day}
                </span>

                {isToday ? (
                  <span className="text-[7px] sm:text-[10px] bg-amber-400 text-slate-950 font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded sm:rounded-md shadow-sm">
                    اليوم
                  </span>
                ) : isBooked ? (
                  <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80 animate-pulse-dot"></span>
                ) : (
                  <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 opacity-60"></span>
                )}
              </div>

              {/* Booking Info Card inside Tile */}
              {isBooked ? (
                selectedHallId === 'all' && dayBookings.length > 1 ? (
                  <div className="mt-0.5 sm:mt-1 bg-slate-950/90 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-rose-500/30">
                    <p className="text-[8px] sm:text-[11px] font-bold text-rose-300 leading-tight truncate">
                      {dayBookings.length} حجز
                    </p>
                  </div>
                ) : (
                  <div className="mt-0.5 sm:mt-1 bg-slate-950/90 backdrop-blur-sm p-0.5 sm:p-1.5 rounded-lg sm:rounded-xl border border-rose-500/30 overflow-hidden">
                    <p className="text-[8px] sm:text-xs font-black text-rose-200 truncate leading-tight">
                      {firstBooking.groomName}
                    </p>
                    <p className="text-[7px] sm:text-[10px] text-amber-400 truncate font-bold mt-0.5 hidden xs:block">
                      {getHallName(firstBooking.hallId)}
                    </p>
                  </div>
                )
              ) : (
                <div className="hidden md:block text-[10px] text-emerald-400/80 font-medium truncate">
                  متاح للحجز
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
