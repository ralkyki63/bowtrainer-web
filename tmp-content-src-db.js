import Dexie from 'dexie';

export const db = new Dexie('bowtrainerDB');

db.version(6).stores({
    chats: '++id, role, content, timestamp',
    trainingPlans: '++id, assignedAthleteId, title, category, day, focus, arrows, exercises',
    athletes: '++id, name, age, gender, height, weight, drawWeight, drawLength, scoreIndoor, scoreOutdoor, distanceOutdoor, trainingDays, targetScoreOutdoor, aiInstructions',
    trainingLogs: '++id, assignedAthleteId, date, title, content'
});
