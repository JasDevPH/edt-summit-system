// FILE: store/slices/eventsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Event } from "@/types";

interface EventsState {
  events: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
}

const initialState: EventsState = {
  events: [],
  selectedEvent: null,
  isLoading: false,
};

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload;
    },
    addEvent: (state, action: PayloadAction<Event>) => {
      state.events.unshift(action.payload);
    },
    updateEvent: (state, action: PayloadAction<Event>) => {
      const index = state.events.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
      if (state.selectedEvent?.id === action.payload.id) {
        state.selectedEvent = action.payload;
      }
    },
    removeEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
      if (state.selectedEvent?.id === action.payload) {
        state.selectedEvent = null;
      }
    },
    setSelectedEvent: (state, action: PayloadAction<Event | null>) => {
      state.selectedEvent = action.payload;
    },
    setEventsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  setSelectedEvent,
  setEventsLoading,
} = eventsSlice.actions;

export default eventsSlice.reducer;
