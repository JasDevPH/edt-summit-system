// FILE: components/providers/ReduxProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { initializeAuth } from "@/store/slices/authSlice";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      store.dispatch(initializeAuth());
      initialized.current = true;
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
