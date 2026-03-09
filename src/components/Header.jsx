import React from 'react';
import { Target, Activity, Users, PenTool } from 'lucide-react';

export default function Header({ onToggleSidebar, currentView, onNavigate }) {
    return (
        <header className="header glass-panel">
            <div className="logo-container">
                <Target className="logo-icon" size={28} color="var(--accent-gold)" />
                <h1 className="logo-text">Bowtrainer <span className="logo-pro">Pro</span></h1>
            </div>
            <nav className="nav-links">
                <button
                    className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onNavigate('dashboard')}
                    style={currentView === 'dashboard' ? { borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' } : {}}
                >
                    <Activity size={20} /> Dashboard
                </button>
                <button
                    className={`nav-btn ${currentView === 'diary' ? 'active' : ''}`}
                    onClick={() => onNavigate('diary')}
                    style={currentView === 'diary' ? { borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' } : {}}
                >
                    <PenTool size={20} /> Tagebuch
                </button>
                <button
                    className={`nav-btn ${currentView === 'athletes' ? 'active' : ''}`}
                    onClick={() => onNavigate('athletes')}
                    style={currentView === 'athletes' ? { borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' } : {}}
                >
                    <Users size={20} /> Athleten
                </button>
                {currentView === 'dashboard' && (
                    <button className="nav-btn" onClick={onToggleSidebar} style={{ marginLeft: '1rem' }}>
                        <Activity size={20} /> Trainingspläne
                    </button>
                )}
            </nav>
        </header>
    );
}
