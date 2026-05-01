import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { z } from "zod";
import {
  AvailabilitySlot,
  db,
  generateId,
  matchScoreBetweenUsers,
  Message,
  Note,
  Proficiency,
  User
} from "./store";
import { seedInMemoryData } from "./seedData";

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET || "dev-secret";

seedInMemoryData();

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    credentials: true
  }
});

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "StudyGroupFinder API" });
});

type AuthedRequest = Request & {
  user?: User;
};

const signToken = (user: User): string => {
  return jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
};

const authMiddleware = (req: AuthedRequest, res: Response, next: NextFunction): void => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Missing token" });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    const user = db.users.find((item) => item.id === payload.userId);
    if (!user) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const levelSchema = z.enum(["beginner", "intermediate", "advanced"] satisfies [Proficiency, Proficiency, Proficiency]);
const availabilitySchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(1).max(24)
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    university: z.string().min(2).max(120),
    department: z.string().min(2).max(120),
    password: z.string().min(8)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const existing = db.users.find((item) => item.email === parsed.data.email.toLowerCase());
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const user: User = {
    id: generateId(),
    email: parsed.data.email.toLowerCase(),
    username: parsed.data.username,
    university: parsed.data.university.trim(),
    department: parsed.data.department.trim(),
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
    interests: [],
    availability: [],
    totalXp: 0,
    totalStudyMinutes: 0
  };

  db.users.push(user);
  res.status(201).json({
    token: signToken(user),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      university: user.university,
      department: user.department,
      interests: user.interests,
      availability: user.availability,
      totalXp: user.totalXp,
      totalStudyMinutes: user.totalStudyMinutes
    }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const user = db.users.find((item) => item.email === parsed.data.email.toLowerCase());
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  res.json({
    token: signToken(user),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      university: user.university,
      department: user.department,
      interests: user.interests,
      availability: user.availability,
      totalXp: user.totalXp,
      totalStudyMinutes: user.totalStudyMinutes
    }
  });
});

app.get("/api/auth/me", authMiddleware, (req: AuthedRequest, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      university: user.university,
      department: user.department,
      interests: user.interests,
      availability: user.availability,
      totalXp: user.totalXp,
      totalStudyMinutes: user.totalStudyMinutes
    }
  });
});

app.put("/api/profile", authMiddleware, (req: AuthedRequest, res) => {
  const schema = z.object({
    university: z.string().min(2).max(120),
    department: z.string().min(2).max(120),
    interests: z.array(
      z.object({
        topic: z.string().min(2).max(80),
        level: levelSchema
      })
    ),
    availability: z.array(availabilitySchema)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const user = req.user!;
  user.university = parsed.data.university.trim();
  user.department = parsed.data.department.trim();
  user.interests = parsed.data.interests.map((item) => ({
    topic: item.topic.trim(),
    level: item.level
  }));
  user.availability = parsed.data.availability as AvailabilitySlot[];

  res.json({ user });
});

app.get("/api/matches/users", authMiddleware, (req: AuthedRequest, res) => {
  const current = req.user!;
  const candidates = db.users
    .filter((item) => item.id !== current.id)
    .map((item) => ({
      userId: item.id,
      username: item.username,
      interests: item.interests,
      score: matchScoreBetweenUsers(current, item)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json({ matches: candidates });
});

app.get("/api/groups", authMiddleware, (req: AuthedRequest, res) => {
  const currentUserId = req.user!.id;

  const groups = db.groups.map((group) => {
    const endedMinutes = db.sessions
      .filter((session) => session.groupId === group.id)
      .reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

    const activeSessions = db.sessions.filter(
      (session) => session.groupId === group.id && !session.endedAt
    );

    const activeMinutes = db.sessions
      .filter((session) => session.groupId === group.id && !session.endedAt)
      .reduce((sum, session) => {
        const startedAt = new Date(session.startedAt).getTime();
        const now = Date.now();
        const liveMinutes = Math.max(0, Math.round((now - startedAt) / 60000));
        return sum + liveMinutes;
      }, 0);

    const leader = db.users.find((user) => user.id === group.creatorId);
    const memberCount = group.memberIds.length;
    const hasCapacity = memberCount < group.maxMembers;
    const isMember = group.memberIds.includes(currentUserId);

    return {
      ...group,
      memberCount,
      studyTopic: group.topic,
      studyDescription: group.description,
      leaderName: leader?.username || "Unknown",
      totalStudyMinutes: endedMinutes + activeMinutes,
      isActive: activeSessions.length > 0,
      activeSessionCount: activeSessions.length,
      hasCapacity,
      isMember,
      canJoin: !isMember && hasCapacity
    };
  });

  res.json({ groups });
});

app.post("/api/groups", authMiddleware, (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(3).max(80),
    topic: z.string().min(2).max(80),
    description: z.string().min(5).max(300),
    invitedUserIds: z.array(z.string()).optional(),
    maxMembers: z.number().min(2).max(12).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const user = req.user!;
  const invitedMemberIds = (parsed.data.invitedUserIds || []).filter((candidateId) =>
    db.users.some((candidate) => candidate.id === candidateId)
  );

  const memberIds = Array.from(new Set([user.id, ...invitedMemberIds]));
  const maxMembers = Math.max(parsed.data.maxMembers || 6, memberIds.length);

  const group = {
    id: generateId(),
    name: parsed.data.name,
    topic: parsed.data.topic,
    description: parsed.data.description,
    creatorId: user.id,
    memberIds,
    maxMembers
  };

  db.groups.push(group);
  res.status(201).json({ group });
});

app.post("/api/groups/:groupId/join", authMiddleware, (req: AuthedRequest, res) => {
  const user = req.user!;
  const group = db.groups.find((item) => item.id === req.params.groupId);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  if (group.memberIds.length >= group.maxMembers && !group.memberIds.includes(user.id)) {
    res.status(400).json({ message: "Group is full" });
    return;
  }

  if (!group.memberIds.includes(user.id)) {
    group.memberIds.push(user.id);
  }

  res.json({ group });
});

app.post("/api/study-sessions/start", authMiddleware, (req: AuthedRequest, res) => {
  const schema = z.object({
    groupId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const session = {
    id: generateId(),
    userId: req.user!.id,
    groupId: parsed.data.groupId,
    startedAt: new Date().toISOString()
  };

  db.sessions.push(session);
  res.status(201).json({ session });
});

app.post("/api/study-sessions/:sessionId/end", authMiddleware, (req: AuthedRequest, res) => {
  const user = req.user!;
  const session = db.sessions.find(
    (item) => item.id === req.params.sessionId && item.userId === user.id
  );

  if (!session) {
    res.status(404).json({ message: "Session not found" });
    return;
  }

  if (session.endedAt) {
    res.status(400).json({ message: "Session already ended" });
    return;
  }

  const endedAt = new Date();
  const startedAt = new Date(session.startedAt);
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
  const xpEarned = Math.min(300, Math.round(durationMinutes / 6));

  session.endedAt = endedAt.toISOString();
  session.durationMinutes = durationMinutes;
  session.xpEarned = xpEarned;

  user.totalStudyMinutes += durationMinutes;
  user.totalXp += xpEarned;

  res.json({ session, totals: { totalStudyMinutes: user.totalStudyMinutes, totalXp: user.totalXp } });
});

app.get("/api/stats/me", authMiddleware, (req: AuthedRequest, res) => {
  const user = req.user!;
  const recentSessions = db.sessions
    .filter((item) => item.userId === user.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 10);

  res.json({
    totalStudyMinutes: user.totalStudyMinutes,
    totalXp: user.totalXp,
    recentSessions
  });
});

app.get("/api/notes", authMiddleware, (req: AuthedRequest, res) => {
  const user = req.user!;
  const notes = db.notes
    .filter((item) => item.userId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ notes });
});

app.post("/api/notes", authMiddleware, (req: AuthedRequest, res) => {
  const schema = z.object({
    title: z.string().min(2).max(120),
    content: z.string().min(1).max(2000),
    links: z.array(z.string().url()).default([])
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const note: Note = {
    id: generateId(),
    userId: req.user!.id,
    title: parsed.data.title,
    content: parsed.data.content,
    links: parsed.data.links,
    updatedAt: new Date().toISOString()
  };

  db.notes.push(note);
  res.status(201).json({ note });
});

app.put("/api/notes/:noteId", authMiddleware, (req: AuthedRequest, res) => {
  const schema = z.object({
    title: z.string().min(2).max(120),
    content: z.string().min(1).max(2000),
    links: z.array(z.string().url())
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const note = db.notes.find(
    (item) => item.id === req.params.noteId && item.userId === req.user!.id
  );
  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }

  note.title = parsed.data.title;
  note.content = parsed.data.content;
  note.links = parsed.data.links;
  note.updatedAt = new Date().toISOString();

  res.json({ note });
});

app.delete("/api/notes/:noteId", authMiddleware, (req: AuthedRequest, res) => {
  const index = db.notes.findIndex(
    (item) => item.id === req.params.noteId && item.userId === req.user!.id
  );

  if (index === -1) {
    res.status(404).json({ message: "Note not found" });
    return;
  }

  db.notes.splice(index, 1);
  res.status(204).send();
});

app.get("/api/chat/global", authMiddleware, (_req, res) => {
  const messages = db.messages.filter((item) => item.groupId === null).slice(-100);
  res.json({ messages });
});

app.get("/api/chat/groups/:groupId", authMiddleware, (req: AuthedRequest, res) => {
  const group = db.groups.find((item) => item.id === req.params.groupId);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  if (!group.memberIds.includes(req.user!.id)) {
    res.status(403).json({ message: "Not a group member" });
    return;
  }

  const messages = db.messages.filter((item) => item.groupId === group.id).slice(-100);
  res.json({ messages });
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error("Missing token"));
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    const user = db.users.find((item) => item.id === payload.userId);
    if (!user) {
      next(new Error("Invalid token"));
      return;
    }
    socket.data.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user as User;

  socket.on("join:group", (groupId: string) => {
    const group = db.groups.find((item) => item.id === groupId);
    if (!group || !group.memberIds.includes(user.id)) {
      return;
    }
    socket.join(`group:${groupId}`);
  });

  socket.on("chat:global", (content: string) => {
    if (!content || content.trim().length === 0) {
      return;
    }

    const message: Message = {
      id: generateId(),
      userId: user.id,
      username: user.username,
      groupId: null,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    db.messages.push(message);
    io.emit("chat:global:message", message);
  });

  socket.on("chat:group", (payload: { groupId: string; content: string }) => {
    const group = db.groups.find((item) => item.id === payload.groupId);
    if (!group || !group.memberIds.includes(user.id)) {
      return;
    }

    if (!payload.content || payload.content.trim().length === 0) {
      return;
    }

    const message: Message = {
      id: generateId(),
      userId: user.id,
      username: user.username,
      groupId: payload.groupId,
      content: payload.content.trim(),
      createdAt: new Date().toISOString()
    };

    db.messages.push(message);
    io.to(`group:${payload.groupId}`).emit("chat:group:message", message);
  });
});

if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;
