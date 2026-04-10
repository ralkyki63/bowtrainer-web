import React from 'react';
import { Target, Play } from 'lucide-react';
import './Login.css';

export default function Login({ onStart }) {
    return (
        <div className="login-container">
            <div className="login-box glass-panel">
                <div className="login-header">
                    <Target className="logo-icon" size={48} color="var(--accent-gold)" />
                    <h1 className="logo-text">Bowtrainer <span className="logo-pro">Pro</span></h1>
                    <p className="login-subtitle">Dein intelligenter Assistent für den Bogensport</p>
                </div>
                
                <button className="primary-btn start-btn" onClick={onStart} style={{ padding: '1rem 2rem', fontSize: '1.2rem', gap: '0.75rem' }}>
                    <Play size={24} fill="currentColor" />
                    App Starten
                </button>
                
                <div className="login-footer">
                    <p>Klicke auf Starten, um zu beginnen.</p>
                </div>
            </div>
        </div>
    );
}
