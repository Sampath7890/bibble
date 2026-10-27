"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export type NotificationSupport = "unsupported" | NotificationPermission;
export type ToggleResult = "enabled" | "disabled" | "denied" | "unsupported";

function readPermission(): NotificationSupport {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function useTimerNotifications() {
  const [enabled, setEnabled] = useLocalStorage<boolean>("bibble-timer-notifications", false);
  const [permission, setPermission] = useState<NotificationSupport>("default");

  useEffect(() => {
    const id = window.setTimeout(() => setPermission(readPermission()), 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggle = useCallback(async (): Promise<ToggleResult> => {
    if (enabled) {
      setEnabled(false);
      return "disabled";
    }

    let current = readPermission();
    if (current === "unsupported") return "unsupported";
    if (current === "default") {
      current = await Notification.requestPermission();
      setPermission(current);
    }
    if (current !== "granted") return "denied";

    setEnabled(true);
    return "enabled";
  }, [enabled, setEnabled]);

  const notify = useCallback(
    (title: string, body: string) => {
      if (!enabled || readPermission() !== "granted") return;
      try {
        new Notification(title, { body });
      } catch {
        // Some browsers only allow notifications from a service worker; the in-page toast still shows.
      }
    },
    [enabled],
  );

  return { enabled: enabled && permission === "granted", permission, toggle, notify };
}
