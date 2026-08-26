import type { AuthResponse } from '../types/auth';
import { notifyGuestAccessChanged } from '../services/guestTrialService';

export function storeAuthSession(data: AuthResponse) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify({
    id: data.userId,
    username: data.username,
    email: data.email,
    emailVerified: data.emailVerified,
  }));
  notifyGuestAccessChanged();
}
