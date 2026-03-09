import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Users, Plus, Pencil, Trash2, ArrowLeft, Target, Activity, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AthletesDB({ onSelectAthlete, activeAthlete }) {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'm',
        height: '',
        weight: '',
        drawWeight: '',
        drawLength: '',
        scoreIndoor: '',
        scoreOutdoor: '',
        distanceOutdoor: '',
        trainingDays: '',
        targetScoreOutdoor: '',
        aiInstructions: ''
    });

    const athletes = useLiveQuery(() => db.athletes.toArray(), []) || [];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNew = () => {
        setFormData({
            name: '', age: '', gender: 'm', height: '', weight: '', drawWeight: '', drawLength: '',
            scoreIndoor: '', scoreOutdoor: '', distanceOutdoor: '', trainingDays: '', targetScoreOutdoor: '', aiInstructions: ''
        });
        setEditingId(null);
        setView('form');
    };

    const handleEdit = (athlete) => {
        setFormData(athlete);
        setEditingId(athlete.id);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Athlet wirklich löschen?')) {
            await db.athletes.delete(id);
            if (activeAthlete && activeAthlete.id === id) {
                onSelectAthlete(null);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const dataToSave = { ...formData };

            // Explicitly cast numeric fields safely
            const numericFields = ['age', 'height', 'weight', 'drawWeight', 'drawLength', 'scoreIndoor', 'scoreOutdoor', 'distanceOutdoor', 'trainingDays', 'targetScoreOutdoor'];
            numericFields.forEach(field => {
                if (dataToSave[field] === '') {
                    dataToSave[field] = ''; // Keep empty strings empty, don't force 0
                } else if (dataToSave[field] !== null && dataToSave[field] !== undefined) {
                    const parsed = Number(dataToSave[field]);
                    if (!isNaN(parsed)) {
                        dataToSave[field] = parsed;
                    }
                }
            });

            if (editingId) {
                // Use put() to strictly overwrite the entire record
                dataToSave.id = editingId;
                await db.athletes.put(dataToSave);

                if (activeAthlete && activeAthlete.id === editingId) {
                    onSelectAthlete(dataToSave);
                }
            } else {
                if (dataToSave.id) delete dataToSave.id; // Let Dexie auto-generate ID for new entries
                await db.athletes.add(dataToSave);
            }
            setView('list');
        } catch (error) {
            console.error("Fehler beim Speichern des Athleten:", error);
            alert("Es gab einen Fehler beim Speichern: " + error.message);
        }
    };

    return (
        <div className="athletes-container glass-panel">
            <div className="chat-header">
                <Users className="bot-icon" size={24} />
                <h2>Athleten Datenbank</h2>
                {view === 'list' && (
                    <button className="btn-primary" onClick={handleAddNew} style={{ marginLeft: 'auto', display: 'flex', gap: '8px', padding: '0.5rem 1rem' }}>
                        <Plus size={18} /> Neuer Athlet
                    </button>
                )}
            </div>

            <div className="athletes-content">
                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="athletes-grid">
                            {athletes.length === 0 ? (
                                <div className="empty-state">
                                    <p>Noch keine Athleten in der Datenbank.</p>
                                </div>
                            ) : (
                                athletes.map(a => {
                                    const isActive = activeAthlete?.id === a.id;
                                    return (
                                        <motion.div
                                            key={a.id}
                                            className={`athlete-card glass-panel ${isActive ? 'active-athlete-card' : ''}`}
                                            layout
                                            style={isActive ? { borderColor: 'var(--accent-gold)' } : {}}
                                        >
                                            <div className="athlete-card-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {isActive && <CheckCircle2 size={18} color="var(--accent-gold)" />}
                                                    <h3 style={isActive ? { color: 'var(--accent-gold)' } : {}}>{a.name}</h3>
                                                </div>
                                                <div className="athlete-actions">
                                                    <button onClick={() => onSelectAthlete(a)} className="icon-btn" title="Als aktiv setzen" style={isActive ? { background: 'var(--accent-gold)', color: '#000' } : {}}>
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleEdit(a)} className="icon-btn text-blue" title="Bearbeiten"><Pencil size={16} /></button>
                                                    <button onClick={() => handleDelete(a.id)} className="icon-btn text-red" title="Löschen"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="athlete-stats">
                                                <div className="stat-row"><span>Alter/Geschlecht:</span> <strong>{a.age}J / {a.gender.toUpperCase()}</strong></div>
                                                <div className="stat-row"><span>Größe/Gewicht:</span> <strong>{a.height} cm / {a.weight} kg</strong></div>
                                                <div className="stat-row"><span>Zuggew. / Auszug:</span> <strong>{a.drawWeight} lbs / {a.drawLength}"</strong></div>
                                                <div className="divider"></div>
                                                <div className="stat-row"><Activity size={14} className="text-secondary" /> <span>Halle (18m):</span> <strong>{a.scoreIndoor}</strong></div>
                                                <div className="stat-row"><Activity size={14} className="text-secondary" /> <span>Freien ({a.distanceOutdoor}m):</span> <strong>{a.scoreOutdoor}</strong></div>
                                                <div className="stat-row"><Target size={14} className="text-gold" /> <span>Ziel Freien:</span> <strong className="text-gold">{a.targetScoreOutdoor}</strong></div>
                                                <div className="stat-row"><span>Training:</span> <strong>{a.trainingDays}x / Woche</strong></div>
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="athlete-form-container">
                            <button className="nav-btn" onClick={() => setView('list')} style={{ marginBottom: '1.5rem' }}>
                                <ArrowLeft size={18} /> Zurück zur Liste
                            </button>
                            <form onSubmit={handleSave} className="athlete-form">
                                <div className="form-group full-width">
                                    <label>Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="chat-input" required />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Alter</label>
                                        <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="chat-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Geschlecht</label>
                                        <select name="gender" value={formData.gender} onChange={handleInputChange} className="chat-input">
                                            <option value="m">Männlich (m)</option>
                                            <option value="w">Weiblich (w)</option>
                                            <option value="d">Divers (d)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Größe (cm)</label>
                                        <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="chat-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Körpergewicht (kg)</label>
                                        <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} className="chat-input" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Zuggewicht (lbs)</label>
                                        <input type="number" step="0.5" name="drawWeight" value={formData.drawWeight} onChange={handleInputChange} className="chat-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Auszugslänge (inch)</label>
                                        <input type="number" step="0.25" name="drawLength" value={formData.drawLength} onChange={handleInputChange} className="chat-input" required />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label>Training (Tage/Woche)</label>
                                        <input type="number" name="trainingDays" value={formData.trainingDays} onChange={handleInputChange} className="chat-input" />
                                    </div>
                                </div>

                                <div className="form-divider">Leistungsdaten</div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Aktuelle Leistung Halle (18m)</label>
                                        <input type="number" name="scoreIndoor" value={formData.scoreIndoor} onChange={handleInputChange} className="chat-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Aktuelle Leistung Freien</label>
                                        <input type="number" name="scoreOutdoor" value={formData.scoreOutdoor} onChange={handleInputChange} className="chat-input" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>WA Distanz im Freien (m)</label>
                                        <input type="number" name="distanceOutdoor" value={formData.distanceOutdoor} onChange={handleInputChange} className="chat-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Zielleistung Freien (Ringe)</label>
                                        <input type="number" name="targetScoreOutdoor" value={formData.targetScoreOutdoor} onChange={handleInputChange} className="chat-input" style={{ borderColor: 'var(--accent-gold)' }} />
                                    </div>
                                </div>

                                <div className="form-divider" style={{ color: 'var(--accent-blue)' }}>Besondere KI-Anweisungen</div>

                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label>Zusatzregeln für Trainingspläne (z.B. "Ruhetag immer Sonntags", "Montags keine Zugübungen")</label>
                                        <textarea
                                            name="aiInstructions"
                                            value={formData.aiInstructions || ''}
                                            onChange={handleInputChange}
                                            className="chat-input"
                                            placeholder="Der KI-Coach wird diese Vorgaben bei der Erstellung jedes Trainingsplans streng befolgen."
                                            style={{ minHeight: '80px', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                        {editingId ? 'Änderungen speichern' : 'Athlet anlegen'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
