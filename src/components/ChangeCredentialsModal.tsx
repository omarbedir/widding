import React, { useState } from 'react';
import { authService } from '../services/auth';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const currentUser = authService.getCurrentUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('كلمة المرور الجديدة يجب ألا تقل عن 4 أحرف');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.changeCredentials(
        currentPassword,
        newUsername,
        newPassword
      );

      if (result.success) {
        onShowToast(result.message, 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تعديل بيانات الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 text-lg w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-1 flex items-center gap-2 shrink-0">
          <i className="fa-solid fa-user-shield text-amber-500"></i>
          <span>تغيير بيانات دخول الأدمن</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          يمكنك تعديل اسم المستخدم وكلمة المرور الخاصة بلوحة التحكم
        </p>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 pr-1 pl-1 space-y-3.5 text-xs sm:text-sm">
          {/* Current Password */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              كلمة المرور الحالية <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية للتأكيد..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 pl-10 focus:border-amber-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
              >
                <i className={`fa-solid ${showCurrentPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* New Username */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              اسم المستخدم الجديد <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="مثال: admin_omar"
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              كلمة المرور الجديدة <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة مرور جديدة قوية..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 pl-10 focus:border-amber-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
              >
                <i className={`fa-solid ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              تأكيد كلمة المرور الجديدة <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد كتابة كلمة المرور الجديدة..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold rounded-xl transition text-xs shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
