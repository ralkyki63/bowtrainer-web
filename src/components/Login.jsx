import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Target, LogIn } from 'lucide-react';
import './Login.css';

export default function Login() {
    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Fehler beim Login:", error);
            alert("Es gab ein Problem beim Anmelden. Bitte überprüfe deine Konfiguration.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass-panel">
                <div className="login-header">
                    <Target className="logo-icon" size={48} color="var(--accent-gold)" />
                    <h1 className="logo-text">Bowtrainer <span className="logo-pro">Pro</span></h1>
                    <p className="login-subtitle">Dein intelligenter Assistent für den Bogensport</p>
                </div>
                
                <button className="google-login-btn primary-btn" onClick={handleGoogleSignIn}>
                    <LogIn size={20} />
                    Mit Google anmelden
                </button>
                
                <div className="login-footer">
                    <p>Bitte logge dich ein, um fortzufahren.</p>
                </div>
            </div>
        </div>
    );
}
