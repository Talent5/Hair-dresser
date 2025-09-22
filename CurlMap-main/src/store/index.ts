import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import locationSlice from './slices/locationSlice';
import bookingsSlice from './slices/bookingsSlice';
import chatsSlice from './slices/chatsSlice';
import notificationsSlice from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    location: locationSlice,
    bookings: bookingsSlice,
    chats: chatsSlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;