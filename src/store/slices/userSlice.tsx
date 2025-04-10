import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserDetails {
  name: string;
  userCategory?: string;
  mobileNo?: string;
  // add other optional fields if needed
}

interface UserState {
  userDetails: any | null;
}

const initialState: UserState = {
  userDetails: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.userDetails = action.payload;
    },
    clearUserDetails: (state) => {
      state.userDetails = null;
    },
  },
});

// ✅ Export actions (named export)
export const { setUserDetails, clearUserDetails } = userSlice.actions;
// ✅ Export reducer (default export)
export default userSlice.reducer;