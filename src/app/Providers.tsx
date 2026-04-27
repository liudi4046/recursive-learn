"use client";

import { LocaleProvider } from "@/i18n/locale-context";
import { AppStateProvider } from "@/state/app-state-context";
import { SiteHeader } from "@/components/SiteHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppStateProvider>
        <SiteHeader />
        {children}
      </AppStateProvider>
    </LocaleProvider>
  );
}
