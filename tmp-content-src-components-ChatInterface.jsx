import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Send, Bot, User, KeyRound, Copy, Download, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function ChatInterface({ activeAthlete }) {
    const [input, setInput] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownload = (text, idx) => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `bowtrainer_antwort_${idx}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const messagesEndRef = useRef(null);

    // Use dexie-react-hooks to live query the chats table
    const messages = useLiveQuery(() => db.chats.orderBy('timestamp').toArray(), []) || [];

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Load API Key
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            setShowApiKeyInput(true);
        }

        // Fetch knowledge base
        fetch('/knowledge.md')
            .then(res => res.text())
            .then(text => setKnowledgeBase(text))
            .catch(err => console.error("Could not load knowledge base.", err));
    }, []);

    const saveApiKey = (e) => {
        e.preventDefault();
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setShowApiKeyInput(false);
        }
    };

    const handleClearChat = async () => {
        if (window.confirm('Möchtest du den gesamten KI-Chatverlauf wirklich löschen? Der Coach vergisst dann dein bisheriges Chat-Gespräch.')) {
            await db.chats.clear();
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !apiKey) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message to DB
        await db.chats.add({
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        });

        try {
            // Initialize Gemini API
            const genAI = new GoogleGenerativeAI(apiKey);

            let athleteContext = '';
            let diaryContext = '';

            if (activeAthlete) {
                athleteContext = `\n\n### Aktiver Athlet im Fokus (AKTUALISIERTE DATEN!):\nDer Nutzer fragt nach einem Plan/Rat für den Athleten. WICHTIG: Verwende AUSSCHLIESSLICH die folgenden, aktuellsten Daten. Ignoriere strikt alle gegensätzlichen Werte (z.B. ein älteres Zuggewicht), die möglicherweise noch im alten Chat-Verlauf stehen:\n- Name: ${activeAthlete.name}\n- Alter: ${activeAthlete.age} Jahre, Geschlecht: ${activeAthlete.gender}\n- Körpergröße: ${activeAthlete.height} cm, Gewicht: ${activeAthlete.weight} kg\n- ***Zuggewicht: ${activeAthlete.drawWeight} lbs***, ***Auszugslänge: ${activeAthlete.drawLength} inch***\n- Trainingshäufigkeit: ${activeAthlete.trainingDays}x pro Woche\n- Aktuelle Leistung Halle (18m): ${activeAthlete.scoreIndoor} Ringe\n- Aktuelle Leistung Freien (${activeAthlete.distanceOutdoor}m): ${activeAthlete.scoreOutdoor} Ringe\n- Zielleistung Freien (${activeAthlete.distanceOutdoor}m): ${activeAthlete.targetScoreOutdoor} Ringe\n\nBitte beziehe DIESE Daten zwingend in den Plan ein (z.B. passe die Distanzen auf genau ${activeAthlete.distanceOutdoor}m an). Nenne zu Beginn deiner Text-Antwort kurz die berücksichtigten Parameter (z.B. "Hier ist der Plan für ${activeAthlete.drawWeight} lbs, ${activeAthlete.drawLength} inch auf ${activeAthlete.distanceOutdoor}m...").`;

                if (activeAthlete.aiInstructions && activeAthlete.aiInstructions.trim()) {
                    athleteContext += `\n\n### ZUSÄTZLICHE KI-ANWEISUNGEN FÜR DIESEN ATHLETEN:\n${activeAthlete.aiInstructions}\nDu MUSST diese Anweisungen zwingend und ohne Ausnahme bei jedem Trainingsplan und Ratschlag für diesen Athleten befolgen.`;
                }

                // Fetch context from Training Diary
                const recentLogs = await db.trainingLogs
                    .where({ assignedAthleteId: activeAthlete.id })
                    .reverse()
                    .limit(5)
                    .toArray();

                if (recentLogs.length > 0) {
                    diaryContext = `\n\n### WICHTIG - Bisherige Trainingserfahrungen (Tagebuch):\nHier sind die letzten Einträge aus dem Trainingstagebuch des Athleten. Bitte lies diese aufmerksam und lass die Erfolge, Verletzungen oder Problemzonen GANZ KONKRET in deine folgenden Tipps und den neuen Trainingsplan einfließen!\n`;
                    recentLogs.forEach(log => {
                        diaryContext += `- [${log.date}] ${log.title}: "${log.content}"\n`;
                    });
                }
            }

            const jsonInstruction = `\n\n### WICHTIGE ANWEISUNG FÜR TRAININGSPLÄNE:\nWENN du dem Nutzer einen konkreten neuen Trainingsplan vorschlägst, MUSST du ZUSÄTZLICH am äußersten Ende deiner Antwort einen STRICT JSON-Codeblock anhängen, der von \`\`\`json und \`\`\` umschlossen ist.\nDas JSON muss zwingend ein ARRAY von Objekten sein. WICHTIG: Ein Plan MUSS grundsätzlich immer EXAKT 7 TAGE (Montag bis Sonntag) umfassen! Wenn der Nutzer z.B. einen "5-Tage-Plan" möchte, bedeutet das: 5 Tage Bogentraining und 2 Tage Pause (Rest) oder Alternativtraining. Jeder der 7 Tage braucht ein eigenes Objekt im Array.\nSchema:\n[\n  {\n    "day": "Montag: Technik & Sensorik",\n    "focus": "Schwerpunkt des Trainings oder 'Regeneration'",\n    "arrows": "Zahl (z.B. 60-80 Pfeile oder '0 Pfeile')",\n    "category": "Eine aus: technique, strength, competition, rest",\n    "exercises": ["Übung 1", "Übung 2"]\n  }\n]\n\nAntworte ansonsten normal und freundlich mit Text an den Nutzer. Nutze das JSON nur für komplette Trainingspläne.`;

            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: `Du bist Bowtrainer, ein KI-Bogensport-Coach. Nutze ausschließlich die folgende Wissensdatenbank für deine Antworten. Antworte professionell, präzise und ermutigend auf Deutsch.\n\n### Wissensdatenbank:\n${knowledgeBase}${athleteContext}${diaryContext}${jsonInstruction}`
            });

            // Format previous history for Gemini (excluding system msg)
            const chatHistory = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const chat = model.startChat({
                history: chatHistory
            });

            const result = await chat.sendMessage(userMessage);
            let responseText = result.response.text();

            console.log("--- RAW AI RESPONSE ---", responseText);

            let debugMessage = "";

            // Attempt to extract JSON. First look for markdown code blocks
            const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/is;
            let match = responseText.match(jsonRegex);
            let jsonStringToParse = null;
            let regexMatched = false;

            if (match && activeAthlete) {
                jsonStringToParse = match[1];
                regexMatched = true;
            } else if (activeAthlete) {
                // Fallback: If AI didn't use markdown format, try to find the outermost array or object
                const firstBracket = responseText.indexOf('[');
                const lastBracket = responseText.lastIndexOf(']');

                if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
                    jsonStringToParse = responseText.substring(firstBracket, lastBracket + 1);
                }
            }

            if (jsonStringToParse) {
                try {
                    // Try parsing the matched content
                    let jsonText = jsonStringToParse.trim();
                    // Clean up any potential leading/trailing garbage within the block itself
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
                        console.log("Attempting to parse:", jsonText);
                        const parsedData = JSON.parse(jsonText);

                        const plansToSave = isArray ? parsedData : [parsedData];
                        const validPlans = plansToSave.filter(p => p.day && p.exercises && Array.isArray(p.exercises)).map((p, idx) => ({
                            assignedAthleteId: activeAthlete.id,
                            orderIndex: idx,
                            ...p
                        }));

                        if (validPlans.length > 0) {
                            console.log(`Found ${validPlans.length} valid Training Plan JSON(s), saving to indexedDB:`, validPlans);

                            // Find all existing plans for this athlete
                            const existingPlans = await db.trainingPlans.where({ assignedAthleteId: activeAthlete.id }).toArray();

                            // Filter out ONLY the ones that are NOT manually locked
                            const plansToDeleteIds = existingPlans.filter(p => !p.isLocked).map(p => p.id);

                            // Delete only unlocked plans to make room for the new multi-day plan
                            await db.trainingPlans.bulkDelete(plansToDeleteIds);

                            // Add the newly generated plans
                            await db.trainingPlans.bulkAdd(validPlans);
                            responseText += `\n\n✅ **System:** Alte Pläne gelöscht. ${validPlans.length} neue Trainingstage wurden erfolgreich generiert und in deine Sidebar übertragen!`;
                        } else {
                            debugMessage = `\n\n⚠️ [DEBUG] JSON gefunden, aber Felder ungültig (fehlt 'day' oder 'exercises'):\n${JSON.stringify(parsedData, null, 2)}`;
                            console.warn("Extracted JSON did not contain valid plan schemas:", parsedData);
                        }
                    } else {
                        debugMessage = `\n\n⚠️ [DEBUG] Klammern '{' oder '[' im JSON wurden nicht gefunden:\n${jsonStringToParse}`;
                    }
                } catch (parseErr) {
                    debugMessage = `\n\n⚠️ [DEBUG] JSON-Fehler: Konnte den Code nicht parsen (${parseErr.message}).\nCode war:\n${jsonStringToParse}`;
                    console.error("Failed to parse AI training plan JSON", parseErr, "Text was:", jsonStringToParse);
                }

                // Strip the JSON block from the user-facing text
                if (regexMatched) {
                    responseText = responseText.replace(jsonRegex, '').trim();
                } else {
                    responseText = responseText.replace(jsonStringToParse, '').trim();
                }
            } else if (activeAthlete && userMessage.toLowerCase().includes("plan")) {
                debugMessage = `\n\n⚠️ [DEBUG] Kein JSON-Block gefunden in der Antwort:\n${result.response.text()}`;
            }

            if (debugMessage) {
                responseText += debugMessage;
            }

            await db.chats.add({
                role: 'assistant',
                content: responseText,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error("Gemini API Error:", error);
            await db.chats.add({
                role: 'assistant',
                content: "Entschuldigung, es gab einen Fehler bei der Kommunikation mit der KI. Bitte überprüfe deinen API-Key oder deine Internetverbindung.",
                timestamp: Date.now()
            });
            if (error.message && error.message.includes("API key not valid")) {
                setShowApiKeyInput(true);
                localStorage.removeItem('gemini_api_key');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (showApiKeyInput) {
        return (
            <section className="chat-container glass-panel" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
                    <KeyRound size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>API-Key erforderlich</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                        Bitte gib deinen Google Gemini API-Key ein, um mit dem Coach zu chatten. Der Key wird nur lokal in deinem Browser gespeichert.
                    </p>
                    <form onSubmit={saveApiKey} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="chat-input"
                            required
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0 1rem' }}>Speichern</button>
                    </form>
                </div>
            </section>
        );
    }

    return (
        <section className="chat-container glass-panel">
            <div className="chat-header">
                <Bot className="bot-icon" size={24} />
                <h2>Dein KI-Coach</h2>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handleClearChat}
                        className="icon-btn text-red"
                        title="Chat-Verlauf löschen & Neu starten"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => { setShowApiKeyInput(true); setApiKey(''); localStorage.removeItem('gemini_api_key'); }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        API-Key ändern
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id || idx}
                            className={`message-wrapper ${msg.role === 'user' ? 'is-user' : 'is-assistant'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                                <div className="message-avatar">
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="var(--accent-gold)" />}
                                </div>
                                <div className="message-content" style={{ whiteSpace: 'pre-wrap', position: 'relative' }}>
                                    {msg.content}
                                    {msg.role === 'assistant' && (
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id || idx)}
                                                className="icon-btn"
                                                style={{ background: 'transparent', border: 'none', color: copiedId === (msg.id || idx) ? 'var(--accent-gold)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                                title={copiedId === (msg.id || idx) ? "Kopiert!" : "Text kopieren"}
                                            >
                                                {copiedId === (msg.id || idx) ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDownload(msg.content, idx)}
                                                className="icon-btn"
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                                title="Als Textdatei speichern"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div className="message-wrapper is-assistant" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="message-bubble assistant-bubble">
                                <div className="message-avatar"><Bot size={16} color="var(--accent-gold)" /></div>
                                <div className="message-content">
                                    <span className="typing-indicator">... analysiere ...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Frag nach SPT-Übungen, Zuggewicht oder Technik..."
                    className="chat-input"
                    disabled={isLoading || !knowledgeBase}
                />
                <button type="submit" className="chat-send-btn" disabled={!input.trim() || isLoading || !knowledgeBase}>
                    <Send size={20} />
                </button>
            </form>
        </section>
    );
}
