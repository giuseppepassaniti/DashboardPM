import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import Gantt from 'frappe-gantt';
import { ArrowLeft } from 'lucide-react';

// 1. Importiamo i dati direttamente dal file JSON
import allMilestonesData from '../data/milestone.json';

// --- Funzioni di Utility (prese dal tuo HTML) ---
const parseItalianDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parts = dateString.split('/');
    return parts.length !== 3 ? null : dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
};

const getStatusClasses = (status) => {
    const classes = {
        'Completata': 'bg-green-100 text-green-800 border-green-300',
        'In corso': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'Pianificata': 'bg-blue-100 text-blue-800 border-blue-300',
        'In ritardo': 'bg-red-100 text-red-800 border-red-300',
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// --- Componente Pagina Milestone ---
export default function Milestone({ projectId, onNavigate }) {
    const [milestones, setMilestones] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [currentView, setCurrentView] = useState('cards');
    const ganttRef = useRef(null); // Riferimento all'elemento SVG per il Gantt

    useEffect(() => {
        // 2. Filtriamo i dati in base al projectId ricevuto
        const today = dayjs().startOf('day');
        
        const projectMilestones = allMilestonesData
            .filter(m => m.Progetto === projectId) // Filtra per il progetto selezionato
            .map(row => {
                const deadline = parseItalianDate(row.Deadline);
                let calculatedStatus = row.Stato;
                if (row.Stato !== 'Completata' && deadline && deadline.isBefore(today)) {
                    calculatedStatus = 'In ritardo';
                }
                return {
                    name: row.Milestone,
                    project: row.Progetto,
                    startDate: parseItalianDate(row['Start Date']),
                    deadline,
                    status: row.Stato,
                    calculatedStatus,
                };
            });

        setMilestones(projectMilestones);
        if (projectMilestones.length > 0) {
            setProjectName(projectMilestones[0].project);
        }

    }, [projectId]); // Questo codice viene eseguito ogni volta che 'projectId' cambia

    // Effetto per creare o aggiornare il diagramma di Gantt
    useEffect(() => {
        if (currentView === 'gantt' && ganttRef.current && milestones.length > 0) {
            ganttRef.current.innerHTML = ''; // Pulisce il Gantt precedente

            const tasks = milestones.map((m, i) => ({
                id: `task_${i}`,
                name: m.name,
                start: m.startDate.format('YYYY-MM-DD'),
                end: m.deadline.format('YYYY-MM-DD'),
                progress: m.status === 'Completata' ? 100 : 0,
                custom_class: `bar-${m.calculatedStatus.toLowerCase().replace(/\s+/g, '-')}`
            }));

            new Gantt(ganttRef.current, tasks, {
                language: 'it',
                view_mode: 'Week',
                header_height: 50,
                bar_height: 20,
            });
        }
    }, [currentView, milestones]); // Si riesegue se cambia la vista o i dati

    // Se nessun progetto è selezionato, mostra un messaggio
    if (!projectId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Nessun progetto selezionato</h2>
                <p className="text-slate-500 mt-2">Torna alla pagina dei progetti e selezionane uno per vedere le milestone.</p>
                <button onClick={() => onNavigate('Progetti')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Torna ai Progetti
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <button onClick={() => onNavigate('Progetti')} className="inline-flex items-center text-blue-600 font-semibold hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Progetti
            </button>
            
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Milestone</h1>
                    <p className="text-slate-600 mt-1">Stato di avanzamento per il progetto: <span className="font-semibold">{projectName}</span></p>
                </div>
                <div className="flex items-center bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setCurrentView('cards')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'cards' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Card</button>
                    <button onClick={() => setCurrentView('gantt')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'gantt' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Gantt</button>
                </div>
            </header>

            {milestones.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p>Nessuna milestone trovata per questo progetto.</p>
                </div>
            ) : (
                currentView === 'cards' ? (
                    <div className="bg-white rounded-lg shadow-md p-5">
                        <div className="flex flex-wrap gap-3">
                            {milestones.map((m, i) => (
                                <span key={i} className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusClasses(m.calculatedStatus)}`}>
                                    {m.name}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div id="gantt-container" className="bg-white p-4 rounded-lg shadow-md">
                        <svg ref={ganttRef}></svg>
                    </div>
                )
            )}
        </div>
    );
}
// Pagina milestone
