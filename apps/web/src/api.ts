const API_URL = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api")
).replace(/\/$/, "");

export type User = {
  id: string;
  email: string;
  username: string;
  university: string;
  department: string;
  totalXp: number;
  totalStudyMinutes: number;
  interests: Array<{ topic: string; level: "beginner" | "intermediate" | "advanced" }>;
  availability: Array<{ day: string; startHour: number; endHour: number }>;
};

const withAuth = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (payload as { message?: string })?.message || "Request failed";
    throw new Error(message);
  }
  return payload as T;
}

export async function register(payload: {
  email: string;
  username: string;
  university: string;
  department: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse<{ token: string; user: User }>(res);
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse<{ token: string; user: User }>(res);
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, { headers: withAuth(token) });
  return res.json();
}

export async function saveProfile(
  token: string,
  payload: {
    university: string;
    department: string;
    interests: Array<{ topic: string; level: "beginner" | "intermediate" | "advanced" }>;
    availability: Array<{ day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; startHour: number; endHour: number }>;
  }
) {
  const res = await fetch(`${API_URL}/profile`, {
    method: "PUT",
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getMatches(token: string) {
  const res = await fetch(`${API_URL}/matches/users`, { headers: withAuth(token) });
  return res.json();
}

export async function getGroups(token: string) {
  const res = await fetch(`${API_URL}/groups`, { headers: withAuth(token) });
  return res.json();
}

export async function createGroup(
  token: string,
  payload: { name: string; topic: string; description: string; invitedUserIds?: string[] }
) {
  const res = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function joinGroup(token: string, groupId: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
    method: "POST",
    headers: withAuth(token)
  });
  return res.json();
}

export async function startSession(token: string, groupId?: string) {
  const res = await fetch(`${API_URL}/study-sessions/start`, {
    method: "POST",
    headers: withAuth(token),
    body: JSON.stringify({ groupId })
  });
  return res.json();
}

export async function endSession(token: string, sessionId: string) {
  const res = await fetch(`${API_URL}/study-sessions/${sessionId}/end`, {
    method: "POST",
    headers: withAuth(token)
  });
  return res.json();
}

export async function getStats(token: string) {
  const res = await fetch(`${API_URL}/stats/me`, { headers: withAuth(token) });
  return res.json();
}

export async function listNotes(token: string) {
  const res = await fetch(`${API_URL}/notes`, { headers: withAuth(token) });
  return res.json();
}

export async function createNote(
  token: string,
  payload: { title: string; content: string; links: string[] }
) {
  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function listGlobalMessages(token: string) {
  const res = await fetch(`${API_URL}/chat/global`, { headers: withAuth(token) });
  return res.json();
}

export async function listGroupMessages(token: string, groupId: string) {
  const res = await fetch(`${API_URL}/chat/groups/${groupId}`, { headers: withAuth(token) });
  return res.json();
}
