// src/utils/logout.ts
import { AppDispatch } from 'src/store';
import { clearUserDetails } from 'src/store/slices/userSlice';

export const logoutUser = (dispatch: AppDispatch, setAuthStatus: (auth: boolean) => void) => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('mustResetPassword');
  localStorage.removeItem('userDetails');
  dispatch(clearUserDetails());
  setAuthStatus(false);
};