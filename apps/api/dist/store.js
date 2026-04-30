"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchScoreBetweenUsers = exports.availabilityOverlapHours = exports.generateId = exports.db = void 0;
exports.db = {
    users: [],
    groups: [],
    sessions: [],
    notes: [],
    messages: []
};
const generateId = () => {
    return Math.random().toString(36).slice(2, 10);
};
exports.generateId = generateId;
const levelOrder = {
    beginner: 1,
    intermediate: 2,
    advanced: 3
};
const availabilityOverlapHours = (a, b) => {
    let hours = 0;
    for (const left of a) {
        for (const right of b) {
            if (left.day !== right.day) {
                continue;
            }
            const overlap = Math.max(0, Math.min(left.endHour, right.endHour) - Math.max(left.startHour, right.startHour));
            hours += overlap;
        }
    }
    return hours;
};
exports.availabilityOverlapHours = availabilityOverlapHours;
const matchScoreBetweenUsers = (current, candidate) => {
    const currentByTopic = new Map(current.interests.map((item) => [item.topic.trim().toLowerCase(), item.level]));
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
        }
        else if (diff === 1) {
            levelCompatibility += 0.6;
        }
        else {
            levelCompatibility += 0.2;
        }
    }
    const overlapHours = (0, exports.availabilityOverlapHours)(current.availability, candidate.availability);
    const score = sharedTopics * 35 + levelCompatibility * 20 + Math.min(overlapHours, 10) * 4.5;
    return Number(score.toFixed(1));
};
exports.matchScoreBetweenUsers = matchScoreBetweenUsers;
