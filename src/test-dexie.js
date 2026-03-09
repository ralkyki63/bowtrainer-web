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
