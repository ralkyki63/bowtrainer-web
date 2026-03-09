import React, { useState } from 'react';
import { Target, Activity, CalendarDays, Zap, Crosshair, Plus, Trash2, User, Coffee, Download, ChevronUp, ChevronDown, Lock, Unlock, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

export default function TrainingPlans({ activeAthlete }) {
    const plansRaw = useLiveQuery(
        () => activeAthlete ? db.trainingPlans.where({ assignedAthleteId: activeAthlete.id }).toArray() : [],
        [activeAthlete]
    ) || [];

    const [showManualForm, setShowManualForm] = useState(false);
    const [formData, setFormData] = useState({ day: 'Zusatztraining', focus: 'Technik', arrows: '50 Pfeile', category: 'technique', exercises: '' });

    const plans = [...plansRaw].sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : a.id;
        const orderB = b.orderIndex !== undefined ? b.orderIndex : b.id;
        return orderA - orderB;
    });

    const handleMovePlan = async (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === plans.length - 1) return;

        const newPlans = [...plans];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        // Tausche die beiden Elemente im Array
        const temp = newPlans[index];
        newPlans[index] = newPlans[swapIndex];
        newPlans[swapIndex] = temp;

        const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

        // Aktualisiere alle Pläne: Neue Reihenfolge und aktualisierter Wochentag im Namen
        for (let i = 0; i < newPlans.length; i++) {
            const plan = newPlans[i];
            const targetWeekday = weekdays[i % 7];

            let suffix = plan.day;
            const colonIndex = plan.day.indexOf(':');

            if (colonIndex !== -1) {
                // Wenn ein Doppelpunkt existiert (z.B. "Tag 1 (Montag): Technik & Sensorik"), nimm alles danach
                suffix = plan.day.substring(colonIndex + 1).trim();
            } else {
                // Wenn kein Doppelpunkt da ist, versuche bekannte Prefix-Muster zu entfernen
                suffix = suffix.replace(/^(Tag\s+\d+\s*\([^\)]+\)|Tag\s+\d+|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)[\s-:]*/i, '').trim();
            }

            if (!suffix) suffix = "Training";

            const newDayName = `Tag ${i + 1} (${targetWeekday}): ${suffix}`;

            await db.trainingPlans.update(plan.id, {
                orderIndex: i,
                day: newDayName
            });
        }
    };

    const handleAddDemoPlan = async () => {
        if (!activeAthlete) return;

        // Add default Masterclass plans for the active athlete
        await db.trainingPlans.bulkAdd([
            {
                assignedAthleteId: activeAthlete.id,
                orderIndex: plans.length,
                day: "Tag 1: Technik & Sensorik",
                focus: "Reproduzierbarkeit des Ablaufs",
                arrows: "60 - 80 Pfeile",
                category: "technique",
                exercises: [
                    "Blindschießen (Blank-Bale) auf 3-5m",
                    "Nullpunkt-Korrektur (Natural Point of Aim)",
                    "Übung 'Click and Pull' (Kontrolle der Expansionsphase)"
                ]
            },
            {
                assignedAthleteId: activeAthlete.id,
                orderIndex: plans.length + 1,
                day: "Tag 2: Kraftausdauer & SPT",
                focus: "Physische Basis & Haltewille",
                arrows: "40 - 60 Pfeile",
                category: "strength",
                exercises: [
                    "SPT 1 (Ausdauer): Halten im Vollauszug (30-45 Sek)",
                    "SPT 2 (Kraft): Kontrolliertes Ziehen in den Anker (3x10 Wdh)",
                    "Schießtraining mit Zusatzgewicht",
                    "Core-Stabilität (Planks & Thorax-Rotation)"
                ]
            }
        ]);
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('Plan wirklich löschen?')) {
            await db.trainingPlans.delete(id);
        }
    };

    const handleToggleLock = async (id, currentLockedState) => {
        await db.trainingPlans.update(id, { isLocked: !currentLockedState });
    };

    const handleSaveManualPlan = async (e) => {
        e.preventDefault();
        if (!activeAthlete || !formData.day.trim()) return;

        const exercisesList = formData.exercises.split('\n').filter(s => s.trim() !== '');

        await db.trainingPlans.add({
            assignedAthleteId: activeAthlete.id,
            orderIndex: plans.length,
            day: formData.day,
            focus: formData.focus,
            arrows: formData.arrows,
            category: formData.category,
            exercises: exercisesList.length > 0 ? exercisesList : ["Individuelles Training"],
            isLocked: true // Manuelle Pläne sind standardmäßig sicher vor der KI
        });

        setShowManualForm(false);
        setFormData({ day: 'Zusatztraining', focus: 'Technik', arrows: '50 Pfeile', category: 'technique', exercises: '' });
    };

    const getIconForCategory = (category) => {
        switch (category) {
            case 'technique': return <Crosshair size={20} color="var(--accent-blue)" />;
            case 'strength': return <Zap size={20} color="var(--accent-red)" />;
            case 'rest': return <Coffee size={20} color="var(--text-secondary)" />;
            default: return <Target size={20} color="var(--accent-gold)" />;
        }
    };

    const handleExportPlans = () => {
        if (!plans || plans.length === 0 || !activeAthlete) return;

        let content = `TRAININGSPLAN FÜR: ${activeAthlete.name.toUpperCase()}\n`;
        content += `-----------------------------------------\n`;
        content += `Ziel: ${activeAthlete.targetScoreOutdoor} Ringe\n`;
        content += `Zuggewicht / Auszug: ${activeAthlete.drawWeight} lbs / ${activeAthlete.drawLength} inch\n`;
        content += `Trainingstage pro Woche: ${activeAthlete.trainingDays}\n\n`;

        plans.forEach(plan => {
            content += `=========================================\n`;
            content += `TAG: ${plan.day}\n`;
            content += `FOKUS: ${plan.focus}\n`;
            content += `PFEILANZAHL: ${plan.arrows}\n`;
            content += `KATEGORIE: ${plan.category}\n`;
            content += `-----------------------------------------\n`;
            content += `ÜBUNGEN:\n`;
            if (plan.exercises && plan.exercises.length > 0) {
                plan.exercises.forEach(exe => {
                    content += `  - ${exe}\n`;
                });
            } else {
                content += `  (Keine speziellen Übungen gelistet)\n`;
            }
            content += `\n`;
        });

        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `Trainingsplan_${activeAthlete.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (!activeAthlete) {
        return (
            <aside className="sidebar-container glass-panel">
                <div className="sidebar-header">
                    <CalendarDays size={24} color="var(--text-primary)" />
                    <h2>Trainingspläne</h2>
                </div>
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Bitte wähle zuerst über den "Athleten"-Tab einen Athleten aus, um dessen Trainingspläne zu sehen.</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="sidebar-container glass-panel">
            <div className="sidebar-header" style={{ justifyContent: 'space-between', borderBottom: 'none', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarDays size={24} color="var(--text-primary)" />
                    <h2 style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        Pläne
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 'normal' }}>
                            {activeAthlete.name}
                        </span>
                    </h2>
                </div>
                {plans.length > 0 && (
                    <button onClick={handleExportPlans} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Trainingsplan als Text speichern">
                        <Download size={20} />
                    </button>
                )}
            </div>

            <div className="athlete-mini-profile" style={{ margin: '0 1.5rem 1rem 1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    <User size={16} /> <strong>{activeAthlete.name}</strong> ({activeAthlete.age}J)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <div>Zug / Auszug: <strong style={{ color: '#fff' }}>{activeAthlete.drawWeight}lbs / {activeAthlete.drawLength}"</strong></div>
                    <div>Training: <strong style={{ color: '#fff' }}>{activeAthlete.trainingDays}x/W</strong></div>
                    <div>Halle: <strong style={{ color: '#fff' }}>{activeAthlete.scoreIndoor}</strong></div>
                    <div>Ziel: <strong style={{ color: 'var(--accent-gold)' }}>{activeAthlete.targetScoreOutdoor}</strong></div>
                </div>
            </div>

            <div className="plans-list" style={{ paddingTop: '0', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                {plans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                        <p style={{ marginBottom: '1rem' }}>Noch keine Pläne für {activeAthlete.name} vorhanden.</p>
                        <button className="btn-primary" onClick={handleAddDemoPlan} style={{ margin: '0 auto', display: 'flex', gap: '8px', padding: '0.5rem 1rem' }}>
                            <Plus size={16} /> Standard-Pläne laden
                        </button>
                        <p style={{ marginTop: '2rem', fontSize: '0.85rem' }}>
                            Oder frage den KI-Coach im Chat nach einem individuellen Plan für {activeAthlete.name}!
                        </p>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <AnimatePresence>
                            {plans.map((plan, idx) => (
                                <motion.div key={plan.id} className="plan-card glass-panel" variants={itemVariants} layout exit={{ opacity: 0, scale: 0.9 }}>
                                    <div className="plan-header" style={{ justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="plan-icon-wrapper">{getIconForCategory(plan.category)}</div>
                                            <h3>{plan.day}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => handleToggleLock(plan.id, plan.isLocked)} className="icon-btn" style={{ background: 'transparent', border: 'none', color: plan.isLocked ? 'var(--accent-gold)' : 'var(--text-secondary)' }} title={plan.isLocked ? "Vor KI geschützt" : "Kann von KI überschrieben werden"}>
                                                {plan.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                            </button>
                                            <button onClick={() => handleMovePlan(idx, 'up')} disabled={idx === 0} className="icon-btn" style={{ background: 'transparent', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)' }} title="Tag nach oben verschieben">
                                                <ChevronUp size={16} />
                                            </button>
                                            <button onClick={() => handleMovePlan(idx, 'down')} disabled={idx === plans.length - 1} className="icon-btn" style={{ background: 'transparent', border: 'none', color: idx === plans.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)' }} title="Tag nach unten verschieben">
                                                <ChevronDown size={16} />
                                            </button>
                                            <button onClick={() => handleDeletePlan(plan.id)} className="icon-btn text-red" style={{ background: 'transparent', border: 'none', marginLeft: '4px' }} title="Plan löschen">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="plan-meta">
                                        <span className="badge">{plan.arrows}</span>
                                        <span className="focus-text">{plan.focus}</span>
                                    </div>

                                    <ul className="plan-exercises">
                                        {plan.exercises?.map((exe, idx) => (
                                            <li key={idx}><Activity size={12} className="bullet-icon" /> {exe}</li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {plans.length > 0 && !showManualForm && (
                    <button onClick={() => setShowManualForm(true)} className="btn-secondary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px', padding: '0.75rem' }}>
                        <Plus size={16} /> Eigenen Plan ergänzen
                    </button>
                )}

                {showManualForm && (
                    <div className="glass-panel" style={{ marginTop: '1rem', padding: '1rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Lock size={14} color="var(--accent-gold)" /> Manuell Hinzufügen
                        </h4>
                        <form onSubmit={handleSaveManualPlan} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input type="text" value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })} placeholder="Tag / Titel" className="chat-input" required />
                            <input type="text" value={formData.focus} onChange={e => setFormData({ ...formData, focus: e.target.value })} placeholder="Fokus" className="chat-input" required />
                            <input type="text" value={formData.arrows} onChange={e => setFormData({ ...formData, arrows: e.target.value })} placeholder="Pfeile (z.B. 100)" className="chat-input" />
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="chat-input" style={{ width: '100%', cursor: 'pointer', appearance: 'none' }}>
                                <option value="technique">Technik (Blau)</option>
                                <option value="strength">Kraft (Rot)</option>
                                <option value="competition">Wettkampf (Gold)</option>
                                <option value="rest">Regeneration (Grau)</option>
                            </select>
                            <textarea value={formData.exercises} onChange={e => setFormData({ ...formData, exercises: e.target.value })} placeholder="Übungen (eine pro Zeile)" className="chat-input" style={{ minHeight: '60px', resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Speichern</button>
                                <button type="button" onClick={() => setShowManualForm(false)} className="icon-btn text-red" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}><X size={20} /></button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </aside>
    );
}
