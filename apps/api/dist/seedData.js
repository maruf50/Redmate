"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_CREDENTIALS = void 0;
exports.seedInMemoryData = seedInMemoryData;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const store_1 = require("./store");
const DEMO_PASSWORD = "DemoPass123!";
function seedInMemoryData() {
    if (store_1.db.users.length > 0) {
        return;
    }
    const now = Date.now();
    const toIso = (minutesAgo) => new Date(now - minutesAgo * 60000).toISOString();
    const users = [
        {
            id: "u_demo",
            email: "demo@studygroupfinder.app",
            username: "Maruf",
            university: "United International University",
            department: "CSE",
            passwordHash: bcryptjs_1.default.hashSync(DEMO_PASSWORD, 10),
            interests: [
                { topic: "Algebra", level: "intermediate" },
                { topic: "Physics", level: "beginner" },
                { topic: "DSA", level: "intermediate" }
            ],
            availability: [
                { day: "mon", startHour: 18, endHour: 21 },
                { day: "wed", startHour: 18, endHour: 21 }
            ],
            totalXp: 220,
            totalStudyMinutes: 780
        },
        {
            id: "u_bob",
            email: "bob@studygroupfinder.app",
            username: "Bob",
            university: "State University",
            department: "Mathematics",
            passwordHash: bcryptjs_1.default.hashSync(DEMO_PASSWORD, 10),
            interests: [
                { topic: "Algebra", level: "advanced" },
                { topic: "Calculus", level: "intermediate" }
            ],
            availability: [
                { day: "mon", startHour: 19, endHour: 22 },
                { day: "thu", startHour: 18, endHour: 20 }
            ],
            totalXp: 340,
            totalStudyMinutes: 1120
        },
        {
            id: "u_carla",
            email: "carla@studygroupfinder.app",
            username: "Carla",
            university: "Metro Institute",
            department: "Engineering",
            passwordHash: bcryptjs_1.default.hashSync(DEMO_PASSWORD, 10),
            interests: [
                { topic: "Physics", level: "intermediate" },
                { topic: "DSA", level: "beginner" }
            ],
            availability: [
                { day: "wed", startHour: 17, endHour: 20 },
                { day: "fri", startHour: 18, endHour: 21 }
            ],
            totalXp: 175,
            totalStudyMinutes: 640
        },
        {
            id: "u_dan",
            email: "dan@studygroupfinder.app",
            username: "Dan",
            university: "Tech College",
            department: "Computer Science",
            passwordHash: bcryptjs_1.default.hashSync(DEMO_PASSWORD, 10),
            interests: [
                { topic: "DSA", level: "advanced" },
                { topic: "Algebra", level: "beginner" }
            ],
            availability: [
                { day: "tue", startHour: 18, endHour: 22 },
                { day: "wed", startHour: 18, endHour: 20 }
            ],
            totalXp: 290,
            totalStudyMinutes: 980
        },
        {
            id: "u_ella",
            email: "ella@studygroupfinder.app",
            username: "Ella",
            university: "Metro Institute",
            department: "Physics",
            passwordHash: bcryptjs_1.default.hashSync(DEMO_PASSWORD, 10),
            interests: [
                { topic: "Physics", level: "advanced" },
                { topic: "Calculus", level: "intermediate" }
            ],
            availability: [
                { day: "mon", startHour: 18, endHour: 20 },
                { day: "sat", startHour: 10, endHour: 13 }
            ],
            totalXp: 410,
            totalStudyMinutes: 1350
        }
    ];
    const groups = [
        {
            id: "g_alg",
            name: "Algebra Power Hour",
            topic: "Algebra",
            description: "Daily equation-solving drills and timed quizzes.",
            creatorId: "u_bob",
            memberIds: ["u_bob", "u_demo", "u_dan"],
            maxMembers: 6
        },
        {
            id: "g_phy",
            name: "Physics Problem Solvers",
            topic: "Physics",
            description: "Concept review and problem walkthrough for mechanics.",
            creatorId: "u_ella",
            memberIds: ["u_ella", "u_carla"],
            maxMembers: 5
        },
        {
            id: "g_dsa",
            name: "DSA Ranked Queue",
            topic: "DSA",
            description: "LeetCode sprint and discussion with rotating leader.",
            creatorId: "u_dan",
            memberIds: ["u_dan", "u_demo", "u_carla", "u_bob"],
            maxMembers: 4
        }
    ];
    const sessions = [
        {
            id: "s_live_alg",
            userId: "u_bob",
            groupId: "g_alg",
            startedAt: toIso(35)
        },
        {
            id: "s_alg_done",
            userId: "u_demo",
            groupId: "g_alg",
            startedAt: toIso(220),
            endedAt: toIso(160),
            durationMinutes: 60,
            xpEarned: 10
        },
        {
            id: "s_phy_done",
            userId: "u_ella",
            groupId: "g_phy",
            startedAt: toIso(520),
            endedAt: toIso(430),
            durationMinutes: 90,
            xpEarned: 15
        },
        {
            id: "s_dsa_done",
            userId: "u_dan",
            groupId: "g_dsa",
            startedAt: toIso(300),
            endedAt: toIso(210),
            durationMinutes: 90,
            xpEarned: 15
        }
    ];
    const notes = [
        {
            id: "n_demo_1",
            userId: "u_demo",
            title: "Exam Plan",
            content: "Algebra revision: Chapter 4 and Chapter 5 before Friday.",
            links: ["https://www.khanacademy.org/math/algebra"],
            updatedAt: toIso(90)
        },
        {
            id: "n_demo_2",
            userId: "u_demo",
            title: "DSA Practice",
            content: "Complete 3 medium problems: stack, graph, and dp.",
            links: ["https://leetcode.com/problemset/"],
            updatedAt: toIso(40)
        }
    ];
    const messages = [
        {
            id: "m_global_1",
            userId: "u_carla",
            username: "Carla",
            groupId: null,
            content: "Anyone up for a quick revision sprint tonight?",
            createdAt: toIso(45)
        },
        {
            id: "m_global_2",
            userId: "u_demo",
            username: "Maruf",
            groupId: null,
            content: "I can join after 8 PM.",
            createdAt: toIso(38)
        },
        {
            id: "m_group_1",
            userId: "u_bob",
            username: "Bob",
            groupId: "g_alg",
            content: "Warm-up solved. Ready for timed round.",
            createdAt: toIso(30)
        },
        {
            id: "m_group_2",
            userId: "u_demo",
            username: "Maruf",
            groupId: "g_alg",
            content: "Let us do 10 equations in 20 minutes.",
            createdAt: toIso(26)
        }
    ];
    store_1.db.users.push(...users);
    store_1.db.groups.push(...groups);
    store_1.db.sessions.push(...sessions);
    store_1.db.notes.push(...notes);
    store_1.db.messages.push(...messages);
}
exports.DEMO_CREDENTIALS = {
    email: "demo@studygroupfinder.app",
    password: DEMO_PASSWORD,
    username: "Maruf"
};
