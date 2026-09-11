import { getSupabaseClient } from '../lib/supabase';
import type { AppUser } from '../types';
import { dbService, getLocalUsers } from './db';

const STORAGE_KEY_AUTH_SESSION = 'wedding_auth_session';

export interface ActiveSessionUser {
  id: string;
  name: string;
  username: string;
}

export const authService = {
  isLoggedIn(): boolean {
    const session = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    return Boolean(session);
  },

  getCurrentUser(): ActiveSessionUser | null {
    const session = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      const localUsers = getLocalUsers();
      const matched = localUsers.find(
        (u) =>
          (parsed.id && u.id === parsed.id) ||
          (parsed.username && u.username.toLowerCase() === parsed.username.toLowerCase())
      );

      let resolvedName = (matched?.name || parsed.name || '').trim();
      if (!resolvedName || resolvedName.toLowerCase() === 'admin' || resolvedName === 'مسؤول النظام') {
        resolvedName =
          matched?.name && matched.name.toLowerCase() !== 'admin' && matched.name !== 'مسؤول النظام'
            ? matched.name
            : 'المدير العام';
      }

      return {
        id: matched?.id || parsed.id || 'user-admin-1',
        name: resolvedName,
        username: matched?.username || parsed.username || 'admin',
      };
    } catch {
      return null;
    }
  },

  // كل الحسابات لها صلاحيات الأدمن كاملة
  isAdmin(): boolean {
    return true;
  },

  async login(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string; user?: ActiveSessionUser }> {
    const trimmedUsername = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUsername || !trimmedPass) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Check in 'users' table by username
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', trimmedUsername)
          .single();

        if (!error && user) {
          if (user.password === trimmedPass) {
            const displayName =
              user.name && user.name.toLowerCase() !== 'admin' && user.name !== 'مسؤول النظام'
                ? user.name
                : (user.username.toLowerCase() === 'admin' ? 'المدير العام' : user.username);

            const sessionUser: ActiveSessionUser = {
              id: user.id,
              name: displayName,
              username: user.username,
            };
            localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
          } else {
            return { success: false, message: 'كلمة المرور غير صحيحة' };
          }
        }
      } catch (err) {
        console.warn('Supabase login check error:', err);
      }
    }

    // Local / Default Admin fallback check
    const localUsers = getLocalUsers();
    const matchedUser = localUsers.find(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (matchedUser) {
      if (matchedUser.password === trimmedPass) {
        const displayName =
          matchedUser.name && matchedUser.name.toLowerCase() !== 'admin' && matchedUser.name !== 'مسؤول النظام'
            ? matchedUser.name
            : (matchedUser.username.toLowerCase() === 'admin' ? 'المدير العام' : matchedUser.username);

        const sessionUser: ActiveSessionUser = {
          id: matchedUser.id,
          name: displayName,
          username: matchedUser.username,
        };
        localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }
    }

    // Direct default admin fallback
    if (trimmedUsername.toLowerCase() === 'admin' && trimmedPass === 'admin') {
      const sessionUser: ActiveSessionUser = {
        id: 'user-admin-1',
        name: 'المدير العام',
        username: 'admin',
      };
      localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  },

  async changeCredentials(
    currentPasswordInput: string,
    newNameInput: string,
    newUsernameInput: string,
    newPasswordInput?: string
  ): Promise<{ success: boolean; message: string }> {
    const currPass = currentPasswordInput.trim();
    const newName = newNameInput.trim();
    const newUsername = (newUsernameInput || '').trim().toLowerCase();
    const newPass = (newPasswordInput || '').trim();

    if (!currPass) {
      return { success: false, message: 'يرجى إدخال كلمة المرور الحالية للتأكيد' };
    }
    if (!newName || !newUsername) {
      return { success: false, message: 'يرجى إدخال اسم صاحب الحساب واسم المستخدم' };
    }

    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'جلسة العمل غير صالحة، يرجى تسجيل الدخول مجدداً' };
    }

    const localUsers = getLocalUsers();
    const targetUser = localUsers.find((u) => u.id === currentUser.id);

    if (targetUser && targetUser.password && targetUser.password !== currPass) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }

    // Check duplicate username if username changed
    if (
      targetUser &&
      newUsername !== targetUser.username.toLowerCase() &&
      localUsers.some((u) => u.id !== currentUser.id && u.username.toLowerCase() === newUsername)
    ) {
      return { success: false, message: 'اسم المستخدم هذا مستخدم بالفعل بحساب آخر' };
    }

    const finalPass = newPass ? newPass : (targetUser?.password || currPass);

    const updated: AppUser = {
      id: currentUser.id,
      name: newName,
      username: newUsername,
      password: finalPass,
    };
    await dbService.upsertUser(updated);

    const updatedSession: ActiveSessionUser = {
      id: currentUser.id,
      name: newName,
      username: newUsername,
    };
    localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(updatedSession));

    return { success: true, message: 'تم تحديث بيانات حسابك بنجاح!' };
  },

  async createUser(
    userData: Omit<AppUser, 'id' | 'created_at'>
  ): Promise<{ success: boolean; message: string; user?: AppUser }> {
    const name = userData.name.trim();
    const username = userData.username.trim().toLowerCase();
    const password = (userData.password || '').trim();

    if (!name || !username || !password) {
      return { success: false, message: 'يرجى تعبئة كافة الحقول (الاسم، اسم المستخدم، وكلمة المرور)' };
    }

    // Check duplicate username
    const localUsers = getLocalUsers();
    if (localUsers.some((u) => u.username.toLowerCase() === username)) {
      return { success: false, message: 'اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر' };
    }

    const newUser: AppUser = {
      id: 'usr-' + Date.now(),
      name,
      username,
      password,
      created_at: new Date().toISOString(),
    };

    const res = await dbService.upsertUser(newUser);
    if (!res.success && res.error) {
      return {
        success: false,
        message: `تعذر الحفظ في Supabase: ${res.error}. تأكد من إنشاء جدول users في Supabase.`,
      };
    }

    return { success: true, message: `تمت إضافة المستخدم (${name}) بنجاح`, user: newUser };
  },

  async updateUser(
    user: AppUser
  ): Promise<{ success: boolean; message: string }> {
    const res = await dbService.upsertUser(user);

    // If updating currently logged in user, refresh active session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      const updatedSession: ActiveSessionUser = {
        id: user.id,
        name: user.name,
        username: user.username,
      };
      localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(updatedSession));
    }

    if (!res.success && res.error) {
      return {
        success: false,
        message: `تعذر التحديث في Supabase: ${res.error}`,
      };
    }

    return { success: true, message: `تم تحديث بيانات المستخدم (${user.name}) بنجاح` };
  },

  async deleteUser(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      return { success: false, message: 'لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به' };
    }

    const localUsers = getLocalUsers();
    if (localUsers.length <= 1) {
      return { success: false, message: 'لا يمكن حذف المستخدم الأخير في النظام' };
    }

    await dbService.deleteUser(userId);
    return { success: true, message: 'تم حذف المستخدم بنجاح' };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
  },
};

