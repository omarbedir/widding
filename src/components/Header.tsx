import React from 'react';
import { authService } from '../services/auth';

interface HeaderProps {
  onOpenHallsModal: () => void;
  onOpenChangeCredentials: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHallsModal,
  onOpenChangeCredentials,
  onLogout,
}) => {
  const currentUser = authService.getCurrentUser();

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center gap-2">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black shrink-0">
            <i className="fa-solid fa-crown text-lg sm:text-xl"></i>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent truncate">
              قاعات نادي اجوان
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-semibold hidden xs:block truncate">
              نظام إدارة وحجوزات الأفراح والمناسبات
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Manage Halls Button */}
          <button
            type="button"
            onClick={onOpenHallsModal}
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-700 border border-slate-700 text-amber-400 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <i className="fa-solid fa-building-user text-xs sm:text-sm"></i>
            <span>إدارة القاعات</span>
          </button>

          {/* Admin Profile / Change Password Button */}
          <button
            type="button"
            onClick={onOpenChangeCredentials}
            className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            title="تغيير اسم المستخدم وكلمة المرور"
          >
            <i className="fa-solid fa-user-gear text-amber-400 text-xs"></i>
            <span className="hidden sm:inline">
              {currentUser?.username ? `الأدمن (${currentUser.username})` : 'حساب الأدمن'}
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            title="تسجيل الخروج"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
            <span className="hidden xs:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
