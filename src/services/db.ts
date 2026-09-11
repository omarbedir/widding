import type { Hall, Booking, AppUser } from '../types';
import { getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY_HALLS = 'wedding_halls_data_v2';
const STORAGE_KEY_BOOKINGS = 'wedding_bookings_data_v2';
const STORAGE_KEY_USERS = 'wedding_users_data_v1';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin-1',
    name: 'المدير العام',
    username: 'admin',
    password: 'admin',
  },
];

// Local Storage helpers
export function getLocalHalls(): Hall[] {
  const data = localStorage.getItem(STORAGE_KEY_HALLS);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLocalHalls(halls: Hall[]): void {
  localStorage.setItem(STORAGE_KEY_HALLS, JSON.stringify(halls));
}

export function getLocalBookings(): Booking[] {
  const data = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLocalBookings(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
}

export function getLocalUsers(): AppUser[] {
  const data = localStorage.getItem(STORAGE_KEY_USERS);
  if (!data) {
    saveLocalUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsSave = false;
      const normalized = parsed.map((u: any) => {
        if (!u.name || u.name.trim().toLowerCase() === 'admin' || u.name === 'مسؤول النظام') {
          needsSave = true;
          return {
            ...u,
            name: u.username?.toLowerCase() === 'admin' ? 'المدير العام' : (u.username || 'المدير العام'),
          };
        }
        return u;
      });
      if (needsSave) {
        saveLocalUsers(normalized);
      }
      return normalized;
    }
    return DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveLocalUsers(users: AppUser[]): void {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

// Supabase synchronization service
export const dbService = {
  async fetchHalls(): Promise<{ data: Hall[]; isSupabase: boolean }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('halls')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          const halls: Hall[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            capacity: item.capacity,
            created_at: item.created_at,
          }));
          saveLocalHalls(halls);
          return { data: halls, isSupabase: true };
        }
      } catch (e) {
        console.warn('Supabase fetch halls failed, fallback to local', e);
      }
    }
    return { data: getLocalHalls(), isSupabase: false };
  },

  async fetchBookings(): Promise<{ data: Booking[]; isSupabase: boolean }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('date', { ascending: true });

        if (!error && data) {
          const bookings: Booking[] = data.map((item: any) => {
            let creatorName = item.created_by_name || '';
            const rawNotes = item.notes || '';
            let cleanNotes = rawNotes;

            // If created_by_name was not in column, check if tagged in notes
            if (!creatorName && rawNotes.includes('[المسؤول:')) {
              const match = rawNotes.match(/\[المسؤول:\s*([^\]]+)\]/);
              if (match) {
                creatorName = match[1].trim();
                cleanNotes = rawNotes.replace(/\[المسؤول:\s*[^\]]+\]/, '').trim();
              }
            }

            return {
              id: item.id,
              groomName: item.groom_name,
              phone: item.phone,
              secondaryPhone: item.secondary_phone || '',
              recommendation: item.recommendation || '',
              hallId: item.hall_id,
              date: item.date,
              totalAmount: Number(item.total_amount) || 0,
              paidAmount: Number(item.paid_amount) || 0,
              remainingAmount: Number(item.remaining_amount) || 0,
              notes: cleanNotes,
              createdById: item.created_by_id || '',
              createdByName: creatorName || 'مسؤول النظام',
              created_at: item.created_at,
            };
          });
          saveLocalBookings(bookings);
          return { data: bookings, isSupabase: true };
        }
      } catch (e) {
        console.warn('Supabase fetch bookings failed, fallback to local', e);
      }
    }
    return { data: getLocalBookings(), isSupabase: false };
  },

  async upsertHall(hall: Hall): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('halls').upsert({
          id: hall.id,
          name: hall.name,
          capacity: hall.capacity,
        });
        if (error) console.error('Supabase upsert hall error:', error);
      } catch (e) {
        console.warn('Supabase error on save hall:', e);
      }
    }
    return true;
  },

  async deleteHall(hallId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('halls').delete().eq('id', hallId);
        if (error) console.error('Supabase delete hall error:', error);
      } catch (e) {
        console.warn('Supabase error on delete hall:', e);
      }
    }
    return true;
  },

  async upsertBooking(booking: Booking): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Tag notes with creator so it's always preserved in Supabase even without schema migration
        let notesToSave = booking.notes || '';
        if (booking.createdByName && !notesToSave.includes('[المسؤول:')) {
          notesToSave = notesToSave
            ? `${notesToSave}\n[المسؤول: ${booking.createdByName}]`
            : `[المسؤول: ${booking.createdByName}]`;
        }

        const payload: any = {
          id: booking.id,
          groom_name: booking.groomName,
          phone: booking.phone,
          secondary_phone: booking.secondaryPhone || '',
          recommendation: booking.recommendation || '',
          hall_id: booking.hallId,
          date: booking.date,
          total_amount: booking.totalAmount,
          paid_amount: booking.paidAmount,
          remaining_amount: booking.remainingAmount,
          notes: notesToSave,
          created_by_id: booking.createdById || '',
          created_by_name: booking.createdByName || '',
        };

        const { error } = await supabase.from('bookings').upsert(payload);
        if (error) {
          // If created_by_name / created_by_id columns are not in schema cache, retry without them
          if (
            error.message.includes('created_by_name') ||
            error.message.includes('created_by_id')
          ) {
            delete payload.created_by_id;
            delete payload.created_by_name;
            const retryRes = await supabase.from('bookings').upsert(payload);
            if (retryRes.error) {
              console.error('Supabase upsert retry error:', retryRes.error);
            }
          } else {
            console.error('Supabase upsert booking error:', error);
          }
        }
      } catch (e) {
        console.warn('Supabase error on save booking:', e);
      }
    }
    return true;
  },

  async deleteBooking(bookingId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
        if (error) console.error('Supabase delete booking error:', error);
      } catch (e) {
        console.warn('Supabase error on delete booking:', e);
      }
    }
    return true;
  },

  async fetchUsers(): Promise<{ data: AppUser[]; isSupabase: boolean }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const users: AppUser[] = data.map((item: any) => ({
            id: item.id,
            name: item.name || item.username,
            username: item.username || item.email || 'admin',
            password: item.password,
            created_at: item.created_at,
          }));
          saveLocalUsers(users);
          return { data: users, isSupabase: true };
        }
      } catch (e) {
        console.warn('Supabase fetch users failed, fallback to local', e);
      }
    }
    return { data: getLocalUsers(), isSupabase: false };
  },

  async upsertUser(user: AppUser): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
    const users = getLocalUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    let updated: AppUser[];
    if (idx >= 0) {
      updated = users.map((u) => (u.id === user.id ? user : u));
    } else {
      updated = [...users, user];
    }
    saveLocalUsers(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('users').upsert({
          id: user.id,
          name: user.name,
          username: user.username,
          password: user.password,
        });
        if (error) {
          console.error('Supabase upsert user error:', error);
          return { success: false, isSupabase: false, error: error.message };
        }
        return { success: true, isSupabase: true };
      } catch (e: any) {
        console.warn('Supabase error on save user:', e);
        return { success: false, isSupabase: false, error: e?.message };
      }
    }
    return { success: true, isSupabase: false };
  },

  async deleteUser(userId: string): Promise<boolean> {
    const users = getLocalUsers().filter((u) => u.id !== userId);
    saveLocalUsers(users);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) console.error('Supabase delete user error:', error);
      } catch (e) {
        console.warn('Supabase error on delete user:', e);
      }
    }
    return true;
  },
};

