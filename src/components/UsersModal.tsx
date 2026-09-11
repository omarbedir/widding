import React, { useState, useEffect } from 'react';
import type { AppUser } from '../types';
import { authService } from '../services/auth';
import { dbService } from '../services/db';
import { SUPABASE_SCHEMA_SQL } from '../lib/supabase';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onUsersChange?: (users: AppUser[]) => void;
}

export const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onUsersChange,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSupabaseSynced, setIsSupabaseSynced] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Delete Confirm State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await dbService.fetchUsers();
      setUsers(res.data);
      setIsSupabaseSynced(res.isSupabase);
      onUsersChange?.(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setIsFormOpen(false);
      setEditingUserId(null);
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setEditingUserId(null);
    setIsFormOpen(false);
    setShowPassword(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setIsFormOpen(true);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      onShowToast('يرجى تعبئة الاسم واسم المستخدم', 'error');
      return;
    }

    if (!editingUserId && !password.trim()) {
      onShowToast('يرجى كتابة كلمة المرور للمستخدم الجديد', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        // Update user (including current admin)
        const target = users.find((u) => u.id === editingUserId);
        if (!target) return;

        const updatedUser: AppUser = {
          ...target,
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim() ? password.trim() : target.password,
        };

        const res = await authService.updateUser(updatedUser);
        if (res.success) {
          onShowToast(res.message, 'success');
          resetForm();
          await loadUsers();
        } else {
          onShowToast(res.message, 'error');
        }
      } else {
        // Create new user
        const res = await authService.createUser({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
        });

        if (res.success) {
          onShowToast(res.message, 'success');
          resetForm();
          await loadUsers();
        } else {
          onShowToast(res.message, 'error');
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'حدث خطأ أثناء حفظ المستخدم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setIsSubmitting(true);
    try {
      const res = await authService.deleteUser(userId);
      if (res.success) {
        onShowToast(res.message, 'success');
        setConfirmDeleteId(null);
        await loadUsers();
      } else {
        onShowToast(res.message, 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'حدث خطأ أثناء حذف المستخدم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    onShowToast('تم نسخ كود SQL لـ Supabase إلى الحافظة بنجاح! الصقه في SQL Editor', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition cursor-pointer z-10"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-bold shrink-0">
              <i className="fa-solid fa-users-gear text-lg"></i>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                <span>إدارة المستخدمين (كافة الحسابات مدراء)</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {users.length} مستخدم
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                إضافة وتعديل وحذف مستخدمي النظام بأسماء المستخدمين (مرتبط بقاعدة بيانات Supabase)
              </p>
            </div>
          </div>

          {!isFormOpen && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0 ml-8 sm:ml-0"
            >
              <i className="fa-solid fa-user-plus text-xs"></i>
              <span>مستخدم جديد</span>
            </button>
          )}
        </div>

        {/* Supabase Status Banner */}
        {!isSupabaseSynced && (
          <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-database text-amber-400"></i>
              <span>
                تنبيه: جدول <code className="font-mono font-bold bg-slate-900 px-1 py-0.5 rounded">users</code> لم يُنشأ بعد في Supabase.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-copy"></i>
              <span>نسخ كود SQL لـ Supabase</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 pl-1 space-y-4">
          {/* Add / Edit Form Card */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/40 space-y-3.5 shadow-xl shadow-amber-950/20 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <i className={editingUserId ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus'}></i>
                  <span>
                    {editingUserId
                      ? editingUserId === currentUser?.id
                        ? 'تعديل بيانات حساب الأدمن الحالي'
                        : 'تعديل بيانات المستخدم'
                      : 'إضافة مستخدم جديد (مدير)'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg transition"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-xs">
                    اسم صاحب الحساب (الاسم الظاهر كمسؤول عن الحجز) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: عمر محمد أو المدير العام"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl p-2.5 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition font-medium"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-xs">
                    اسم المستخدم (لتسجيل الدخول) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ahmed أو admin"
                    dir="ltr"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl p-2.5 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition font-medium text-left"
                  />
                </div>

                {/* Password */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1 text-xs">
                    {editingUserId
                      ? 'كلمة المرور الجديدة (اتركها فارغة إذا لا ترغب بتغييرها)'
                      : 'كلمة المرور *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUserId}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUserId ? 'اترك فارغاً للاحتفاظ بكلمة المرور الحالية' : 'أدخل كلمة المرور'}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl p-2.5 pl-10 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>{editingUserId ? 'حفظ التعديلات' : 'إنشاء المستخدم'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Users Cards List */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm flex items-center justify-center gap-2">
              <i className="fa-solid fa-circle-notch fa-spin text-amber-400"></i>
              <span>جاري تحميل بيانات المستخدمين من Supabase...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
              لا يوجد مستخدمون حالياً
            </div>
          ) : (
            <div className="space-y-2.5">
              {users.map((user) => {
                const isCurrentUser = currentUser?.id === user.id || currentUser?.username === user.username;

                return (
                  <div
                    key={user.id}
                    className={`bg-slate-950/80 border p-3.5 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrentUser
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                        <i className="fa-solid fa-crown text-base"></i>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-100 text-xs sm:text-sm truncate">
                            {user.name}
                          </span>

                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <i className="fa-solid fa-shield-halved"></i>
                            <span>مدير (Admin)</span>
                          </span>

                          {isCurrentUser && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                              حسابك الحالي
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 font-mono" dir="ltr">
                            <i className="fa-solid fa-user-tag text-[10px] text-slate-500"></i>
                            <span>اسم المستخدم: </span>
                            <strong className="text-slate-200">@{user.username}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(user)}
                        className="bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="تعديل بيانات المستخدم أو الباسورد"
                      >
                        <i className="fa-solid fa-pen text-[11px]"></i>
                        <span>تعديل</span>
                      </button>

                      {confirmDeleteId === user.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-150">
                          <button
                            type="button"
                            onClick={() => handleDelete(user.id)}
                            disabled={isSubmitting}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-800 text-slate-400 px-2 py-1.5 rounded-xl text-[11px] transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(user.id)}
                          disabled={users.length <= 1}
                          className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={users.length <= 1 ? 'لا يمكن حذف المستخدم الوحيد' : 'حذف المستخدم'}
                        >
                          <i className="fa-solid fa-trash text-[11px]"></i>
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <button
            type="button"
            onClick={handleCopySql}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <i className="fa-solid fa-code text-xs"></i>
            <span>كود SQL لإنشاء جدول المستخدمين في Supabase</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

