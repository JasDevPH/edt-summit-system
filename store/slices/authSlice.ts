// FILE: store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Initially true to check for stored token
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    initializeAuth: (state) => {
      // Load from localStorage on app init
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
          } catch (error) {
            console.error("Failed to parse user from localStorage:", error);
          }
        }
      }
      state.isLoading = false;
    },
  },
});

export const { setCredentials, logout, setLoading, initializeAuth } =
  authSlice.actions;
export default authSlice.reducer;
