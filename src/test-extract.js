const jsonStringToParse = `[
  {
    "day": "Tag 1 (Montag): Technik & Sensorik (Bogenschießen)",
    "focus": "Reproduzierbarkeit des Ablaufs, Schulterposition, tiefer Anker",
    "arrows": "90-110 Pfeile",
    "category": "technique",
    "exercises": [
      "10 Min. Mobilitätsübungen, Deuserband-Schüsse (4x rechts/links zur Aktivierung)",
      "Blank-Bale-Schießen (60 Pfeile auf 3-5m, Fokus: Rückenspannung, Ankergefühl, teilweise mit geschlossenen Augen)",
      "Nullpunkt-Korrektur (Ausziehen mit geschlossenen Augen, Augen im Anker öffnen – Visier muss ohne Korrektur im Gold stehen)",
      "Spezialübung: 30 Pfeile auf Luftkissen/Balancierbrett (Gleichgewichtssinn, Rumpfmuskulatur)",
      "SPT 3 (Struktur): Langsame Auszüge (10 Sek.) vor dem Spiegel ohne Lösen (Knochenlinie, Schulterstellung)"
    ]
  },
  {
    "day": "Tag 2 (Dienstag): Ausdauer (Jogging 1)",
    "focus": "Kardiovaskuläre Fitness, aktive Regeneration",
    "arrows": "0 Pfeile",
    "category": "strength",
    "exercises": [
      "30-45 Minuten lockeres Joggen (Puls < 130)",
      "10 Min. sanftes Dehnen der Bein- und Hüftmuskulatur"
    ]
  }
]`;

let jsonText = jsonStringToParse.trim();
const startBrace = jsonText.indexOf('{');
const startBracket = jsonText.indexOf('[');
let startIndex = -1;
let endIndex = -1;
let isArray = false;

if (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) {
    startIndex = startBracket;
    endIndex = jsonText.lastIndexOf(']');
    isArray = true;
} else if (startBrace !== -1) {
    startIndex = startBrace;
    endIndex = jsonText.lastIndexOf('}');
}

if (startIndex !== -1 && endIndex !== -1) {
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    console.log("Attempting to parse:");
    try {
        const parsedData = JSON.parse(jsonText);
        const plansToSave = isArray ? parsedData : [parsedData];
        const validPlans = plansToSave.filter(p => p.day && p.exercises && Array.isArray(p.exercises)).map(p => ({
            assignedAthleteId: 1,
            ...p
        }));

        if (validPlans.length > 0) {
            console.log(`Found ${validPlans.length} valid Training Plan JSON(s)`);
            console.log(validPlans);
        } else {
            console.warn("Extracted JSON did not contain valid plan schemas:", parsedData);
        }
    } catch (e) {
        console.error("Parse failed", e);
    }
} else {
    console.log("No brackets found");
}
