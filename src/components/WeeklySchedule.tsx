import React from 'react';
import type { Booking } from '../types';
import { formatDateStr, ARABIC_DAY_NAMES } from '../utils/dateUtils';

interface WeeklyScheduleProps {
  bookings: Booking[];
  selectedHallId: string;
  onOpenBookingModal: (dateStr: string) => void;
  onOpenDetailsModal: (bookingId: string) => void;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  bookings,
  selectedHallId,
  onOpenBookingModal,
  onOpenDetailsModal,
}) => {
  const today = new Date();
  const days = [];

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i
    );
    const dateStr = formatDateStr(curDate);
    const dayNum = curDate.getDate();
    const dayOfWeek = ARABIC_DAY_NAMES[curDate.getDay()];

    const dayBookings = bookings.filter((b) => {
      const matchesHall =
        selectedHallId === 'all' || b.hallId === selectedHallId;
      return matchesHall && b.date === dateStr;
    });

    const isBooked = dayBookings.length > 0;

    days.push({
      index: i,
      curDate,
      dateStr,
      dayNum,
      dayOfWeek,
      isBooked,
      booking: dayBookings[0] || null,
      count: dayBookings.length,
    });
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calendar-week text-amber-400 text-base sm:text-lg"></i>
          <h2 className="text-xs sm:text-base font-bold text-slate-100">
            جدول القاعة (الأيام الـ 7 القادمة)
          </h2>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400 bg-slate-800 px-2.5 sm:px-3 py-1 rounded-full border border-slate-700 font-semibold">
          اضغط على اليوم للحجز المباشر
        </span>
      </div>

      {/* 7 Days Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
        {days.map((d) => {
          return (
            <div
              key={d.dateStr}
              onClick={() => {
                if (d.isBooked && d.booking) {
                  onOpenDetailsModal(d.booking.id);
                } else {
                  onOpenBookingModal(d.dateStr);
                }
              }}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[95px] sm:min-h-[110px] relative group hover:-translate-y-0.5 active:scale-95 ${
                d.isBooked
                  ? 'bg-rose-950/40 border-rose-500/60 hover:border-rose-400 text-rose-200 shadow-md shadow-rose-950/30'
                  : 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400 text-emerald-200'
              }`}
            >
              <div className="text-[10px] sm:text-[11px] font-bold opacity-85">
                {d.index === 0 ? 'اليوم' : d.dayOfWeek}
              </div>

              <div className="text-xl sm:text-3xl font-black my-0.5 sm:my-1 text-slate-100 tracking-tight">
                {d.dayNum}
              </div>

              <div
                className={`text-[9px] sm:text-[11px] truncate max-w-full font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-center transition ${
                  d.isBooked
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 group-hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/30'
                }`}
              >
                {d.isBooked
                  ? d.count > 1 && selectedHallId === 'all'
                    ? `${d.count} حجوزات`
                    : d.booking?.groomName
                  : '+ حجز بالموعد'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
