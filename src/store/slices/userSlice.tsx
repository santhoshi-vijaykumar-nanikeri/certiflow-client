import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserDetails {
  name: string;
  userCategory?: string;
  mobileNo?: string;
  // add other optional fields if needed
}

interface UserState {
  userCategoryId: number | null; 
  userDetails: any | null;
}

const initialState: UserState = {
  userCategoryId: null, 
  userDetails: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action: PayloadAction<UserDetails & { userCategoryId?: number }>) => {
      state.userDetails = action.payload;
      state.userCategoryId = action.payload.userCategoryId ?? null;

    },
    clearUserDetails: (state) => {
      state.userDetails = null;
      state.userCategoryId = null;
    },
  },
});

// ✅ Export actions (named export)
export const { setUserDetails, clearUserDetails } = userSlice.actions;
// ✅ Export reducer (default export)
export default userSlice.reducer;