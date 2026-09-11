import { useState, useEffect, useCallback } from 'react';
import type { Hall, Booking, ToastNotification, AppUser } from './types';
import { formatCurrency } from './utils/dateUtils';
import { resolveBookingOwnerName } from './utils/userUtils';
import {
  dbService,
  saveLocalHalls,
  saveLocalBookings,
} from './services/db';
import { authService } from './services/auth';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { HallSelector } from './components/HallSelector';
import { WeeklySchedule } from './components/WeeklySchedule';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { BookingsTable } from './components/BookingsTable';
import { BookingModal } from './components/BookingModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { HallsModal } from './components/HallsModal';
import { UsersModal } from './components/UsersModal';
import { ChangeCredentialsModal } from './components/ChangeCredentialsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/ToastContainer';

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isLoggedIn()
  );
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingInitialDate, setBookingInitialDate] = useState<string>('');
  const [bookingInitialHallId, setBookingInitialHallId] = useState<string | undefined>();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const [isHallsModalOpen, setIsHallsModalOpen] = useState<boolean>(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState<boolean>(false);
  const [isChangeCredentialsOpen, setIsChangeCredentialsOpen] = useState<boolean>(false);


  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  // Load data from Supabase / localStorage
  const loadData = useCallback(async () => {
    const hallsResult = await dbService.fetchHalls();
    const bookingsResult = await dbService.fetchBookings();
    const usersResult = await dbService.fetchUsers();

    const loadedHalls = hallsResult.data;
    setHalls(loadedHalls);
    setBookings(bookingsResult.data);
    setUsers(usersResult.data);

    if (loadedHalls.length > 0) {
      setSelectedHallId((prev) =>
        prev && loadedHalls.some((h) => h.id === prev) ? prev : loadedHalls[0].id
      );
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (halls.length > 0 && (!selectedHallId || !halls.some((h) => h.id === selectedHallId))) {
      setSelectedHallId(halls[0].id);
    }
  }, [halls, selectedHallId]);

  // Hall helpers
  const getHallName = (hallId: string) => {
    const h = halls.find((x) => x.id === hallId);
    return h ? h.name : 'قاعة غير معروفة';
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Logout handler
  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تسجيل الخروج',
      message: 'هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة التحكم؟',
      onConfirm: () => {
        authService.logout();
        setIsAuthenticated(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('تم تسجيل الخروج بنجاح', 'info');
      },
    });
  };

  // Booking Modal handlers
  const handleOpenNewBooking = (dateStr: string = '', preferredHallId?: string) => {
    setEditingBooking(null);
    setBookingInitialDate(dateStr);
    setBookingInitialHallId(
      preferredHallId || (selectedHallId !== 'all' ? selectedHallId : undefined)
    );
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (
    bookingData: Omit<Booking, 'id' | 'created_at'> & { id?: string }
  ) => {
    const { id, hallId, date, groomName, totalAmount, paidAmount } = bookingData;

    if (!hallId) {
      showToast('يرجى إضافة قاعة أولاً من إدارة القاعات قبل تسجيل الحجز', 'error');
      return;
    }

    if (totalAmount > 0 && paidAmount > totalAmount) {
      showToast('خطأ: لا يمكن أن يكون المبلغ المدفوع (العربون) أكبر من المبلغ الكلي', 'error');
      return;
    }

    // Check duplicate booking on same hall and date
    const duplicate = bookings.find(
      (b) => b.hallId === hallId && b.date === date && b.id !== id
    );

    if (duplicate) {
      showToast(
        `تنبيه: يوم ${date} محجوز بالفعل في ${getHallName(hallId)} للعريس (${duplicate.groomName})`,
        'error'
      );
      return;
    }

    const currentUser = authService.getCurrentUser();
    const creatorName = resolveBookingOwnerName(
      { createdById: currentUser?.id, createdByName: currentUser?.name },
      users
    );
    const creatorId = currentUser?.id || '';

    if (id) {
      // Update
      const existing = bookings.find((b) => b.id === id);
      const updatedBooking: Booking = {
        ...bookingData,
        id,
        createdById: existing?.createdById || bookingData.createdById || creatorId,
        createdByName: existing?.createdByName || bookingData.createdByName || creatorName,
      };
      const updatedList = bookings.map((b) =>
        b.id === id ? updatedBooking : b
      );
      setBookings(updatedList);
      saveLocalBookings(updatedList);
      await dbService.upsertBooking(updatedBooking);
      showToast('تم تحديث بيانات الحجز بنجاح', 'success');
    } else {
      // Create new
      const newBooking: Booking = {
        ...bookingData,
        id: 'b-' + Date.now(),
        created_at: new Date().toISOString(),
        createdById: creatorId,
        createdByName: creatorName,
      };
      const updatedList = [...bookings, newBooking];
      setBookings(updatedList);
      saveLocalBookings(updatedList);
      await dbService.upsertBooking(newBooking);
      showToast(
        `تم تسجيل حجز جديد بنجاح في ${getHallName(hallId)} للعريس (${groomName}) بواسطة (${creatorName})`,
        'success'
      );
    }

    setIsBookingModalOpen(false);
    setEditingBooking(null);
  };

  // Details Modal handlers
  const handleOpenDetails = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setIsDetailsModalOpen(true);
  };

  const handleEditFromDetails = (booking: Booking) => {
    setIsDetailsModalOpen(false);
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleDeleteFromDetails = (booking: Booking) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الحجز',
      message: `هل أنت متأكد من إلغاء وحذف حجز العريس (${booking.groomName}) في ${getHallName(
        booking.hallId
      )} بتاريخ ${booking.date}؟`,
      onConfirm: async () => {
        const updated = bookings.filter((b) => b.id !== booking.id);
        setBookings(updated);
        saveLocalBookings(updated);
        await dbService.deleteBooking(booking.id);
        setIsDetailsModalOpen(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('تم حذف الحجز بنجاح', 'success');
      },
    });
  };

  const handleConfirmStatusFromDetails = (booking: Booking) => {
    showToast(`تم تأكيد حجز العريس (${booking.groomName}) بنجاح! 🎉`, 'success');
    setIsDetailsModalOpen(false);
  };

  const handleAddPayment = async (bookingId: string, amountToAdd: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    if (amountToAdd > booking.remainingAmount) {
      showToast(
        `خطأ: المبلغ المضاف (${formatCurrency(amountToAdd)}) يتجاوز المتبقي (${formatCurrency(booking.remainingAmount)})`,
        'error'
      );
      return;
    }

    const newPaidAmount = (booking.paidAmount || 0) + amountToAdd;
    const newRemainingAmount = Math.max(0, (booking.totalAmount || 0) - newPaidAmount);

    const updatedBooking: Booking = {
      ...booking,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
    };

    const updatedList = bookings.map((b) =>
      b.id === bookingId ? updatedBooking : b
    );

    setBookings(updatedList);
    saveLocalBookings(updatedList);
    await dbService.upsertBooking(updatedBooking);

    showToast(
      `تم تسجيل دفعة بقيمة ${formatCurrency(amountToAdd)} لحساب (${booking.groomName}) بنجاح`,
      'success'
    );
  };

  // Halls Modal handlers
  const handleSaveHall = async (hallData: { id?: string; name: string; capacity: number }) => {
    if (hallData.id) {
      // Edit
      const updated = halls.map((h) =>
        h.id === hallData.id ? { ...h, name: hallData.name, capacity: hallData.capacity } : h
      );
      setHalls(updated);
      saveLocalHalls(updated);
      await dbService.upsertHall({
        id: hallData.id,
        name: hallData.name,
        capacity: hallData.capacity,
      });
      showToast(`تم تعديل بيانات ${hallData.name} بنجاح`, 'success');
    } else {
      // New
      const newHall: Hall = {
        id: 'hall-' + Date.now(),
        name: hallData.name,
        capacity: hallData.capacity,
        created_at: new Date().toISOString(),
      };
      const updated = [...halls, newHall];
      setHalls(updated);
      saveLocalHalls(updated);
      await dbService.upsertHall(newHall);
      showToast(`تمت إضافة ${hallData.name} بنجاح`, 'success');
    }
  };

  const handleDeleteHall = (hall: Hall) => {
    const hallBookingsCount = bookings.filter((b) => b.hallId === hall.id).length;
    const warningText =
      hallBookingsCount > 0
        ? `\n⚠️ تحذير: سيتم حذف (${hallBookingsCount}) حجز مرتبط بهذه القاعة نهائياً!`
        : '\nلا توجد حجوزات مرتبطة بهذه القاعة.';

    setConfirmModal({
      isOpen: true,
      title: 'حذف القاعة',
      message: `هل أنت متأكد من حذف قاعة (${hall.name})؟${warningText}`,
      onConfirm: async () => {
        const updatedHalls = halls.filter((h) => h.id !== hall.id);
        const updatedBookings = bookings.filter((b) => b.hallId !== hall.id);

        setHalls(updatedHalls);
        setBookings(updatedBookings);
        saveLocalHalls(updatedHalls);
        saveLocalBookings(updatedBookings);

        if (selectedHallId === hall.id) {
          setSelectedHallId(updatedHalls.length > 0 ? updatedHalls[0].id : '');
        }

        await dbService.deleteHall(hall.id);

        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(`تم حذف قاعة ${hall.name} بنجاح`, 'success');
      },
    });
  };

  // If not logged in, render LoginPage
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={() => setIsAuthenticated(true)}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  const activeBooking = bookings.find((b) => b.id === activeBookingId) || null;

  return (
    <div className="min-h-screen pb-14 flex flex-col overflow-x-hidden bg-[#0f172a] text-[#f8fafc]">
      {/* Top Sticky Header */}
      <Header
        onOpenHallsModal={() => setIsHallsModalOpen(true)}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenChangeCredentials={() => setIsChangeCredentialsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6 flex-1 w-full space-y-4 sm:space-y-6">
        {/* Hall Quick Switcher Tabs */}
        <HallSelector
          halls={halls}
          bookings={bookings}
          selectedHallId={selectedHallId}
          onSelectHall={setSelectedHallId}
        />

        {/* 7 Days Next View Schedule */}
        <WeeklySchedule
          bookings={bookings}
          selectedHallId={selectedHallId}
          users={users}
          onOpenBookingModal={(dateStr) => handleOpenNewBooking(dateStr)}
          onOpenDetailsModal={handleOpenDetails}
        />

        {/* Full Monthly Calendar */}
        <MonthlyCalendar
          halls={halls}
          bookings={bookings}
          selectedHallId={selectedHallId}
          users={users}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToCurrentMonth={handleGoToCurrentMonth}
          onOpenBookingModal={(dateStr, preferredHall) =>
            handleOpenNewBooking(dateStr, preferredHall)
          }
          onOpenDetailsModal={handleOpenDetails}
        />

        {/* Full Bookings History Table */}
        <BookingsTable
          halls={halls}
          bookings={bookings}
          selectedHallId={selectedHallId}
          users={users}
          onOpenDetailsModal={handleOpenDetails}
        />
      </main>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onSave={handleSaveBooking}
        halls={halls}
        initialDate={bookingInitialDate}
        initialHallId={bookingInitialHallId}
        editBooking={editingBooking}
      />

      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setActiveBookingId(null);
        }}
        booking={activeBooking}
        halls={halls}
        users={users}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
        onConfirmStatus={handleConfirmStatusFromDetails}
        onAddPayment={handleAddPayment}
      />

      <HallsModal
        isOpen={isHallsModalOpen}
        onClose={() => setIsHallsModalOpen(false)}
        halls={halls}
        bookings={bookings}
        onSaveHall={handleSaveHall}
        onDeleteHall={handleDeleteHall}
      />

      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        onShowToast={showToast}
        onUsersChange={(newUsers) => setUsers(newUsers)}
      />

      <ChangeCredentialsModal
        isOpen={isChangeCredentialsOpen}
        onClose={() => setIsChangeCredentialsOpen(false)}
        onShowToast={showToast}
        onSuccess={loadData}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default App;
