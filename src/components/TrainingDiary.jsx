import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PenTool, Calendar, User, Trash2, Plus, CalendarDays, KeyRound, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function TrainingDiary({ activeAthlete }) {
    const logs = useLiveQuery(
        () => activeAthlete ? db.trainingLogs.where('assignedAthleteId').equals(activeAthlete.id).reverse().toArray() : [],
        [activeAthlete]
    ) || [];

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: ''
    });

    const handleSaveLog = async (e) => {
        e.preventDefault();
        if (!activeAthlete || !formData.date || !formData.content) return;

        await db.trainingLogs.add({
            assignedAthleteId: activeAthlete.id,
            date: formData.date,
            title: formData.title || 'Trainingseinheit',
            content: formData.content
        });

        setShowForm(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            title: '',
            content: ''
        });
    };

    const handleDeleteLog = async (id) => {
        if (window.confirm("Dieses Tagebuch-Eintrag wirklich löschen?")) {
            await db.trainingLogs.delete(id);
        }
    };

    if (!activeAthlete) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <User size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
                <h2>Kein Athlet ausgewählt</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Bitte wähle im Reiter "Athleten" einen aktiven Athleten aus, um dessen Trainingstagebuch zu öffnen.
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem' }}>
                        <PenTool size={28} color="var(--accent-gold)" />
                        Trainingstagebuch
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Athlet im Fokus: <strong style={{ color: '#fff' }}>{activeAthlete.name}</strong>
                    </p>
                </div>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', gap: '8px' }}>
                        <Plus size={18} /> Neuer Eintrag
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel"
                        style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}
                    >
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <CalendarDays size={20} /> Trainingserfahrung protokollieren
                        </h3>
                        <form onSubmit={handleSaveLog} style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Datum</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="chat-input"
                                        style={{ width: '100%' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Titel / Fokus</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="z.B. Techniktraining 18m, Wettkampf, Schulterprobleme..."
                                        className="chat-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Erfahrungen, Ringzahlen, Probleme</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Was lief heute gut? Was war schwierig? (Dieses Feedback liest auch die KI beim nächsten Trainingsplan!)"
                                    className="chat-input"
                                    style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Abbrechen</button>
                                <button type="submit" className="btn-primary">Tagebuch-Eintrag speichern</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {logs.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <PenTool size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Noch keine Einträge</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Beginne damit, deine Trainingserfahrungen festzuhalten, damit AI-Coach darauf eingehen kann.</p>
                </div>
            ) : (
                <motion.div variants={listVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                variants={itemVariants}
                                layout
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel"
                                style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-gold)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                            <Calendar size={14} />
                                            {new Date(log.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {log.title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="icon-btn text-red"
                                        style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}
                                        title="Eintrag löschen"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                    {log.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
