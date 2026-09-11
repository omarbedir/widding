import React from 'react';
import type { Hall, Booking } from '../types';

interface HallSelectorProps {
  halls: Hall[];
  bookings: Booking[];
  selectedHallId: string;
  onSelectHall: (hallId: string) => void;
}

export const HallSelector: React.FC<HallSelectorProps> = ({
  halls,
  bookings,
  selectedHallId,
  onSelectHall,
}) => {
  const selectedHall = halls.find((h) => h.id === selectedHallId);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl">
      {/* Header & Status Badge */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-building text-amber-400 text-sm sm:text-base"></i>
          <h2 className="text-xs sm:text-base font-bold text-slate-200">
            اختر القاعة للتحكم بحجوزاتها:
          </h2>
        </div>
        {selectedHall && (
          <span className="text-[10px] sm:text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-full font-bold shadow-sm">
            {`القاعة: ${selectedHall.name}`}
          </span>
        )}
      </div>

      {/* Dynamic Hall List Container */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 sm:p-3 shadow-inner">
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {/* Individual Hall Option Cards */}
          {halls.map((hall) => {
            const isSelected = selectedHallId === hall.id;
            const hallBookingsCount = bookings.filter(
              (b) => b.hallId === hall.id
            ).length;

            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => onSelectHall(hall.id)}
                className={`w-full p-2.5 sm:p-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 scale-[1.002]'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base shrink-0 transition ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-amber-400 border border-slate-700/50'
                    }`}
                  >
                    <i className="fa-solid fa-place-of-worship"></i>
                  </div>
                  <div className="text-right min-w-0">
                    <div className="font-extrabold text-xs sm:text-base truncate">
                      {hall.name}
                    </div>
                    <div
                      className={`text-[9px] sm:text-xs mt-0.5 truncate ${
                        isSelected ? 'text-slate-950/80 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      السعة: {hall.capacity || 'غير محدد'} فرد
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 mr-2">
                  <span
                    className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-extrabold ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {hallBookingsCount} حجوزات
                  </span>
                  {isSelected && (
                    <i className="fa-solid fa-circle-check text-slate-950 text-sm sm:text-base"></i>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
