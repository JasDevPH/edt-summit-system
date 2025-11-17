// FILE: store/slices/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalType: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalData: any;
  toast: {
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  };
}

const initialState: UIState = {
  isSidebarOpen: true,
  isModalOpen: false,
  modalType: null,
  modalData: null,
  toast: {
    show: false,
    message: "",
    type: "info",
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.isModalOpen = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.modalType = null;
      state.modalData = null;
    },
    showToast: (
      state,
      action: PayloadAction<{
        message: string;
        type: "success" | "error" | "info" | "warning";
      }>
    ) => {
      state.toast.show = true;
      state.toast.message = action.payload.message;
      state.toast.type = action.payload.type;
    },
    hideToast: (state) => {
      state.toast.show = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
