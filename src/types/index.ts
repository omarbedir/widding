export interface Hall {
  id: string;
  name: string;
  capacity: number;
  price?: number;
  inclusions?: string;
  created_at?: string;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  description?: string;
}

export interface Addition {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  groomName: string;
  phone: string;
  secondaryPhone?: string;
  recommendation?: string;
  hallId: string;
  date: string; // YYYY-MM-DD
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  additionalServicesAmount?: number;
  additions?: Addition[];
  discount?: number;
  payments?: Payment[];
  notes?: string;
  created_at?: string;
  createdById?: string;
  createdByName?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

