import React, { useState, useEffect } from 'react';
import { Flag, ListChecks, Siren, GitPullRequestDraft, Gavel } from 'lucide-react';

// 1. Importiamo i dati direttamente dal file JSON
import progettiData from '../data/progetti.json';

// --- Funzioni di Utility (prese dal tuo HTML) ---
const parseCurrency = (str) => {
    if (typeof str !== 'string' || !str) return 0;
    return parseFloat(str.replace(/[.€\s]/g, '').replace(',', '.')) || 0;
};
const parsePercentage = (str) => {
    if (typeof str !== 'string' || !str) return 0;
    return parseInt(str.replace('%', ''), 10) || 0;
};
const formatCurrency = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value);

const statusInfo = {
    'In corso': { badge: 'bg-yellow-100 text-yellow-800' },
    'Completato': { badge: 'bg-green-100 text-green-800' },
    'Da approvare': { badge: 'bg-blue-100 text-blue-800' },
    'Default': { badge: 'bg-slate-100 text-slate-800' },
};

// --- Componente per la singola Card Progetto ---
// Ho trasformato la tua funzione createProjectCardHTML in un componente React
const ProjectCard = ({ project, onNavigate }) => {
    const stat = statusInfo[project.status] || statusInfo.Default;
    const sections = [
        { name: 'Milestone', page: 'Milestone', icon: <Flag size={12} /> },
        { name: 'Task', page: 'Task', icon: <ListChecks size={12} /> },
        { name: 'Imprevisti', page: 'Imprevisti', icon: <Siren size={12} /> },
        { name: 'Varianti', page: 'Varianti', icon: <GitPullRequestDraft size={12} /> },
        { name: 'Decisioni', page: 'Decisioni', icon: <Gavel size={12} /> }
    ];

    return (
        <div className="project-card bg-white rounded-lg shadow-md flex flex-col">
            <div className="p-4 border-b border-slate-200">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${stat.badge}`}>{project.status}</span>
                </div>
                <p className="text-sm text-slate-500">{project.client} | PM: {project.pm}</p>
            </div>
            <div className="p-4 flex-grow">
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Avanzamento</span>
                        <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div><p className="text-slate-500">Budget</p><p className="font-bold">{formatCurrency(project.budget)}</p></div>
                    <div><p className="text-slate-500">Costi</p><p className="font-bold">{formatCurrency(project.costs)}</p></div>
                    <div><p className="text-slate-500">Previsione</p><p className="font-bold">{formatCurrency(project.forecast)}</p></div>
                </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-b-lg border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Dashboard Operative</p>
                <div className="flex flex-wrap gap-2">
                    {sections.map(sec => (
                        <button 
                            key={sec.name}
                            // 3. Quando cliccato, chiama la funzione passata da App.jsx
                            onClick={() => onNavigate(sec.page, project.id)} 
                            className="flex-1 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                        >
                            {sec.icon}
                            <span className="ml-1.5">{sec.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Componente Principale della Pagina Progetti ---
export default function Progetti({ onNavigate }) {
    // 2. Usiamo lo stato di React per memorizzare i dati dei progetti
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect viene eseguito una sola volta quando il componente appare
    useEffect(() => {
        // Elaboriamo i dati importati dal JSON
        const processedProjects = progettiData.map(row => ({
            id: row['Id Progetto'],
            name: row['Nome Progetto'],
            client: row.Cliente,
            pm: row['PM responsabile'],
            status: row.Stato,
            budget: parseCurrency(row['Budget Iniziale']),
            costs: parseCurrency(row['Costi Sostenuti']),
            forecast: parseCurrency(row['Previsione Finale Costi']),
            progress: parsePercentage(row['% Avanzamento']),
        })).filter(p => p.id && p.name);
        
        setProjects(processedProjects);
        setLoading(false); // Abbiamo finito di caricare
    }, []); // L'array vuoto [] assicura che venga eseguito solo una volta

    return (
        <div className="p-4 md:p-6">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-slate-900">Dashboard Centrale Progetti</h1>
                <p className="text-slate-600 mt-2">Seleziona una dashboard operativa per visualizzare i dettagli di un progetto.</p>
            </header>
            
            <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
                        <h3 className="text-sm font-medium text-slate-900">Caricamento...</h3>
                    </div>
                ) : (
                    projects.map(project => (
                        <ProjectCard key={project.id} project={project} onNavigate={onNavigate} />
                    ))
                )}
            </main>
        </div>
    );
}
// Pagina con elenco progetti
