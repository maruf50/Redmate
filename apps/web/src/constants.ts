import type { View } from "./types";

export const API_SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ??
  (import.meta.env.DEV ? "http://localhost:4000" : window.location.origin)
).replace(/\/$/, "");

export const XP_GOAL = 500;
export const STUDY_HOURS_GOAL = 20;

export const NAV_ITEMS: Array<{ id: View; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "matching", label: "Matching" },
  { id: "groups", label: "Groups" },
  { id: "tracker", label: "Study Tracker" },
  { id: "notes", label: "Notes" },
  { id: "chat", label: "Chat" }
];
