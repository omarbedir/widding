import React, { useState } from 'react';
import { authService } from '../services/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onShowToast,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await authService.login(username, password);
      if (result.success) {
        onShowToast(`تم تسجيل الدخول بنجاح! أهلاً بك (${result.user?.name || 'مرحباً'}) 👑`, 'success');
        onLoginSuccess();
      } else {
        setErrorMsg(result.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء محاولة تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Crown Branding & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/25 mx-auto mb-4 text-slate-950">
            <i className="fa-solid fa-crown text-3xl"></i>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent mb-1.5">
            قاعات نادي اجوان
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold">
            لوحة تحكم وإدارة الحجوزات الذكية
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in shake duration-200">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-base"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Username Field */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم (مثال: admin)"
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 rounded-xl py-3 pr-10 pl-4 focus:border-amber-500 focus:outline-none transition placeholder:text-slate-500 font-medium"
              />
              <i className="fa-solid fa-user absolute right-3.5 top-3.5 text-slate-500 text-sm"></i>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 rounded-xl py-3 pr-10 pl-11 focus:border-amber-500 focus:outline-none transition placeholder:text-slate-500 font-medium"
              />
              <i className="fa-solid fa-lock absolute right-3.5 top-3.5 text-slate-500 text-sm"></i>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-200 transition p-0.5"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                <i
                  className={`fa-solid ${
                    showPassword ? 'fa-eye-slash' : 'fa-eye'
                  } text-sm`}
                ></i>
              </button>
            </div>
          </div>

          {/* Initial Hint */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 text-[11px] leading-relaxed">
            <span className="text-amber-400 font-bold ml-1">
              <i className="fa-solid fa-key ml-1"></i>
              حساب الأدمن الافتراضي:
            </span>
            اسم المستخدم: <code className="text-amber-300 font-mono">admin</code> | كلمة المرور: <code className="text-amber-300 font-mono">admin</code>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-60 mt-2"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                <span>جاري التحقق والدخول...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket text-base"></i>
                <span>تسجيل الدخول إلى النظام</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer copyright */}
      <footer className="mt-8 text-center text-slate-500 text-xs relative z-10">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - نظام قاعات نادي اجوان
      </footer>
    </div>
  );
};
