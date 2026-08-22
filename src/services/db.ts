import type { Hall, Booking } from '../types';
import { getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY_HALLS = 'wedding_halls_data_v2';
const STORAGE_KEY_BOOKINGS = 'wedding_bookings_data_v2';

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
          const bookings: Booking[] = data.map((item: any) => ({
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
            notes: item.notes || '',
            created_at: item.created_at,
          }));
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
        const { error } = await supabase.from('bookings').upsert({
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
          notes: booking.notes || '',
        });
        if (error) console.error('Supabase upsert booking error:', error);
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
};
