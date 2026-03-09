import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import Header from './components/Header.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import TrainingPlans from './components/TrainingPlans.jsx';
import AthletesDB from './components/AthletesDB.jsx';
import TrainingDiary from './components/TrainingDiary.jsx';
import './App.css';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'athletes', 'diary'

    const [activeAthleteId, setActiveAthleteId] = useState(() => {
        const stored = localStorage.getItem('activeAthleteId');
        return stored ? parseInt(stored, 10) : null;
    });

    const activeAthlete = useLiveQuery(
        () => activeAthleteId ? db.athletes.get(activeAthleteId) : Promise.resolve(null),
        [activeAthleteId]
    );

    const handleSelectAthlete = (athlete) => {
        if (athlete) {
            setActiveAthleteId(athlete.id);
            localStorage.setItem('activeAthleteId', athlete.id);
            setCurrentView('dashboard');
        } else {
            setActiveAthleteId(null);
            localStorage.removeItem('activeAthleteId');
        }
    };

    return (
        <div className="app-container">
            <Header
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                currentView={currentView}
                onNavigate={setCurrentView}
            />
            <main className="main-content">
                {currentView === 'dashboard' && (
                    <div className={`dashboard-grid ${sidebarOpen ? 'sidebar-visible' : ''}`}>
                        <aside className="sidebar-area">
                            <TrainingPlans activeAthlete={activeAthlete} />
                        </aside>
                        <section className="chat-area">
                            <ChatInterface activeAthlete={activeAthlete} />
                        </section>
                    </div>
                )}
                {currentView === 'athletes' && (
                    <div className="athletes-view-wrapper">
                        <AthletesDB onSelectAthlete={handleSelectAthlete} activeAthlete={activeAthlete} />
                    </div>
                )}
                {currentView === 'diary' && (
                    <div className="diary-view-wrapper">
                        <TrainingDiary activeAthlete={activeAthlete} />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
