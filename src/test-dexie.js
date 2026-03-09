<<<<<<< HEAD
import { db } from './db.js';

export async function testDexie() {
    try {
        console.log("Checking DB Version...");
        const dbVersion = db.verno;
        console.log("DB Version is:", dbVersion);

        console.log("Adding a test athlete...");
        const id = await db.athletes.add({
            name: "Test Athlete",
            age: 25,
            gender: "m",
            drawWeight: 38,
            drawLength: 29.5,
            scoreOutdoor: 650,
            distanceOutdoor: 70
        });
        console.log("Added test athlete with ID:", id);

        console.log("Fetching test athlete...");
        const athlete = await db.athletes.get(id);
        console.log("Fetched athlete:", athlete);

        console.log("Deleting test athlete...");
        await db.athletes.delete(id);
        console.log("Deleted test athlete.");

        return "Dexie Test Successful!";
    } catch (e) {
        console.error("Dexie Test Failed:", e);
        return "Dexie Test Failed: " + e.message;
    }
}
=======
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

const db = new Dexie('testDB');
db.version(1).stores({
    trainingPlans: '++id, assignedAthleteId, title, category, day, focus, arrows, exercises'
});

async function test() {
    const plans = [
        {
            assignedAthleteId: 1,
            day: "Tag 1",
            category: "technique",
            exercises: ["exercise 1", "exercise 2"],
            focus: "focus",
            arrows: "0 Pfeile"
        }
    ];

    try {
        await db.trainingPlans.bulkAdd(plans);
        console.log("Success! Array was indexed.");
        const results = await db.trainingPlans.toArray();
        console.log(results);
    } catch (e) {
        console.error("Failed to add:", e.message);
    }
}
test();
>>>>>>> 69c2a2c (Initial complete project commit)
