import { getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY_AUTH_SESSION = 'wedding_auth_session';
const STORAGE_KEY_LOCAL_ADMIN = 'wedding_local_admin';

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-1',
  username: 'admin',
  password: 'admin',
};

export function getLocalAdminCredentials(): AdminUser {
  const saved = localStorage.getItem(STORAGE_KEY_LOCAL_ADMIN);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY_LOCAL_ADMIN, JSON.stringify(DEFAULT_ADMIN));
    return DEFAULT_ADMIN;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return DEFAULT_ADMIN;
  }
}

export function saveLocalAdminCredentials(admin: AdminUser): void {
  localStorage.setItem(STORAGE_KEY_LOCAL_ADMIN, JSON.stringify(admin));
}

export const authService = {
  isLoggedIn(): boolean {
    const session = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    return Boolean(session);
  },

  getCurrentUser(): { username: string } | null {
    const session = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  },

  async login(usernameInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> {
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('username', trimmedUser)
          .single();

        if (!error && data) {
          if (data.password === trimmedPass) {
            localStorage.setItem(
              STORAGE_KEY_AUTH_SESSION,
              JSON.stringify({ username: data.username, id: data.id })
            );
            saveLocalAdminCredentials({
              id: data.id,
              username: data.username,
              password: data.password,
            });
            return { success: true };
          } else {
            return { success: false, message: 'كلمة المرور غير صحيحة' };
          }
        }
      } catch (err) {
        console.warn('Supabase auth query failed, fallback to local', err);
      }
    }

    // Local fallback check
    const localAdmin = getLocalAdminCredentials();
    if (trimmedUser === localAdmin.username && trimmedPass === (localAdmin.password || 'admin')) {
      localStorage.setItem(
        STORAGE_KEY_AUTH_SESSION,
        JSON.stringify({ username: localAdmin.username, id: localAdmin.id })
      );
      return { success: true };
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  },

  async changeCredentials(
    currentPasswordInput: string,
    newUsernameInput: string,
    newPasswordInput: string
  ): Promise<{ success: boolean; message: string }> {
    const currPass = currentPasswordInput.trim();
    const newUsername = newUsernameInput.trim();
    const newPass = newPasswordInput.trim();

    if (!currPass) {
      return { success: false, message: 'يرجى إدخال كلمة المرور الحالية للتأكيد' };
    }
    if (!newUsername || !newPass) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم الجديد وكلمة المرور الجديدة' };
    }

    const localAdmin = getLocalAdminCredentials();
    const currentUser = this.getCurrentUser();
    const currentUsername = currentUser?.username || localAdmin.username;

    // Verify current password with Supabase or Local
    const supabase = getSupabaseClient();
    let isPasswordValid = false;
    let adminId = localAdmin.id || 'admin-1';

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('username', currentUsername)
          .single();

        if (!error && data) {
          adminId = data.id;
          if (data.password === currPass) {
            isPasswordValid = true;
          }
        }
      } catch (e) {
        console.warn('Supabase check password failed:', e);
      }
    }

    if (!isPasswordValid) {
      if (currPass === (localAdmin.password || 'admin')) {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }

    // Save changes to Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from('admins').upsert({
          id: adminId,
          username: newUsername,
          password: newPass,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          console.error('Supabase update admin error:', error);
        }
      } catch (err) {
        console.warn('Supabase update admin failed:', err);
      }
    }

    // Save changes locally
    const updatedAdmin: AdminUser = {
      id: adminId,
      username: newUsername,
      password: newPass,
    };
    saveLocalAdminCredentials(updatedAdmin);

    // Update active session
    localStorage.setItem(
      STORAGE_KEY_AUTH_SESSION,
      JSON.stringify({ username: newUsername, id: adminId })
    );

    return { success: true, message: 'تم تحديث بيانات الدخول بنجاح!' };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
  },
};
