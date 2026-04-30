export type Proficiency = "beginner" | "intermediate" | "advanced";

export type AvailabilitySlot = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  startHour: number;
  endHour: number;
};

export type Interest = {
  topic: string;
  level: Proficiency;
};

export type User = {
  id: string;
  email: string;
  username: string;
  university: string;
  department: string;
  passwordHash: string;
  interests: Interest[];
  availability: AvailabilitySlot[];
  totalXp: number;
  totalStudyMinutes: number;
};

export type Group = {
  id: string;
  name: string;
  topic: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  maxMembers: number;
};

export type StudySession = {
  id: string;
  userId: string;
  groupId?: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  xpEarned?: number;
};

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  links: string[];
  updatedAt: string;
};

export type Message = {
  id: string;
  userId: string;
  username: string;
  groupId: string | null;
  content: string;
  createdAt: string;
};

export const db = {
  users: [] as User[],
  groups: [] as Group[],
  sessions: [] as StudySession[],
  notes: [] as Note[],
  messages: [] as Message[]
};

export const generateId = (): string => {
  return Math.random().toString(36).slice(2, 10);
};

const levelOrder: Record<Proficiency, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3
};

export const availabilityOverlapHours = (
  a: AvailabilitySlot[],
  b: AvailabilitySlot[]
): number => {
  let hours = 0;
  for (const left of a) {
    for (const right of b) {
      if (left.day !== right.day) {
        continue;
      }
      const overlap = Math.max(
        0,
        Math.min(left.endHour, right.endHour) - Math.max(left.startHour, right.startHour)
      );
      hours += overlap;
    }
  }
  return hours;
};

export const matchScoreBetweenUsers = (current: User, candidate: User): number => {
  const currentByTopic = new Map(
    current.interests.map((item) => [item.topic.trim().toLowerCase(), item.level])
  );

  let sharedTopics = 0;
  let levelCompatibility = 0;

  for (const interest of candidate.interests) {
    const key = interest.topic.trim().toLowerCase();
    const currentLevel = currentByTopic.get(key);
    if (!currentLevel) {
      continue;
    }
    sharedTopics += 1;
    const diff = Math.abs(levelOrder[currentLevel] - levelOrder[interest.level]);
    if (diff === 0) {
      levelCompatibility += 1;
    } else if (diff === 1) {
      levelCompatibility += 0.6;
    } else {
      levelCompatibility += 0.2;
    }
  }

  const overlapHours = availabilityOverlapHours(current.availability, candidate.availability);
  const score = sharedTopics * 35 + levelCompatibility * 20 + Math.min(overlapHours, 10) * 4.5;
  return Number(score.toFixed(1));
};
