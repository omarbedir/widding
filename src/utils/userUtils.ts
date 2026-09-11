import type { Booking, AppUser } from '../types';
import { getLocalUsers } from '../services/db';

/**
 * Resolves the personal display name of the account owner (اسم صاحب الحساب)
 * for any booking, ensuring it displays the personal name (e.g. 'عمر محمد' or 'المدير العام')
 * rather than login usernames ('admin') or generic placeholders ('مسؤول النظام').
 */
export function resolveBookingOwnerName(
  booking?: Partial<Booking> | null,
  users?: AppUser[]
): string {
  if (!booking) return 'المدير العام';

  const userList = users && users.length > 0 ? users : getLocalUsers();

  // 1. If createdById matches a registered user, return their personal display name
  if (booking.createdById) {
    const userById = userList.find((u) => u.id === booking.createdById);
    if (
      userById?.name &&
      userById.name.toLowerCase() !== 'admin' &&
      userById.name !== 'مسؤول النظام'
    ) {
      return userById.name;
    }
  }

  const rawCreator = (booking.createdByName || '').trim();

  // 2. If rawCreator matches any user's username (e.g. 'admin' or custom usernames)
  if (rawCreator) {
    const userByUsername = userList.find(
      (u) => u.username.toLowerCase() === rawCreator.toLowerCase()
    );
    if (
      userByUsername?.name &&
      userByUsername.name.toLowerCase() !== 'admin' &&
      userByUsername.name !== 'مسؤول النظام'
    ) {
      return userByUsername.name;
    }

    // 3. If rawCreator matches any user's id
    const userById = userList.find((u) => u.id === rawCreator);
    if (
      userById?.name &&
      userById.name.toLowerCase() !== 'admin' &&
      userById.name !== 'مسؤول النظام'
    ) {
      return userById.name;
    }

    // 4. If rawCreator matches any user's personal name
    const userByName = userList.find(
      (u) => u.name.toLowerCase() === rawCreator.toLowerCase()
    );
    if (userByName?.name) {
      return userByName.name;
    }
  }

  // 5. If rawCreator is 'admin', 'مسؤول النظام', or empty:
  // Find the primary admin account or first user
  const adminUser =
    userList.find((u) => u.username.toLowerCase() === 'admin') || userList[0];
  if (
    adminUser?.name &&
    adminUser.name.toLowerCase() !== 'admin' &&
    adminUser.name !== 'مسؤول النظام'
  ) {
    return adminUser.name;
  }

  // 6. If rawCreator is a custom personal name (not 'admin' and not 'مسؤول النظام')
  if (
    rawCreator &&
    rawCreator.toLowerCase() !== 'admin' &&
    rawCreator !== 'مسؤول النظام'
  ) {
    return rawCreator;
  }

  // 7. Ultimate fallback
  return adminUser?.name || 'المدير العام';
}
