import React, { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import Gantt from 'frappe-gantt'; // <-- RIGA AGGIUNTA
import { ArrowLeft, Flame } from 'lucide-react';

// Importiamo i dati dei task
import allTasksData from '../data/task.json';

// --- Funzioni di Utility ---
const parseItalianDate = (d) => d ? dayjs(d, 'DD/MM/YYYY') : null;
const parseFloatWithComma = (n) => typeof n === 'string' ? parseFloat(n.replace(',', '.')) || 0 : 0;
const parsePercentage = (p) => typeof p === 'string' ? parseInt(p.replace('%', ''), 10) || 0 : 0;

// (Il resto del codice rimane identico a prima...)
// --- Componente Tabella ---
const TaskTable = ({ tasks, onSort, sortConfig }) => {
    const getStatusInfo = (task) => {
        if (task.isLate) return { text: 'In Ritardo', badgeClasses: 'bg-red-100 text-red-800', progressBg: 'bg-red-600' };
        const statuses = {
            'Completato': { text: 'Completato', badgeClasses: 'bg-green-100 text-green-800', progressBg: 'bg-green-600' },
            'In corso': { text: 'In Corso', badgeClasses: 'bg-yellow-100 text-yellow-800', progressBg: 'bg-yellow-500' },
            'Pianificato': { text: 'Pianificato', badgeClasses: 'bg-blue-100 text-blue-800', progressBg: 'bg-blue-600' },
        };
        return statuses[task.status] || { text: 'Sconosciuto', badgeClasses: 'bg-slate-100 text-slate-800', progressBg: 'bg-slate-500' };
    };

    const SortableHeader = ({ label, sortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const sortClass = isSorted ? (sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc') : '';
        return (
            <th className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sortable ${sortClass}`} onClick={() => onSort(sortKey)}>
                {label}
            </th>
        );
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <SortableHeader label="Titolo Task" sortKey="title" />
                        <SortableHeader label="Owner" sortKey="owner" />
                        <SortableHeader label="Deadline" sortKey="deadline" />
                        <SortableHeader label="Criticità" sortKey="criticality" />
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">% Compl.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stato</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {tasks.map(task => {
                        const status = getStatusInfo(task);
                        return (
                            <tr key={task.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">{task.title}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{task.owner}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{task.deadline.format('DD/MM/YYYY')}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                    {task.criticality === 'Alta' && <Flame className="inline-block h-4 w-4 text-orange-500" />}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div className={`${status.progressBg} h-2.5 rounded-full`} style={{ width: `${task.completion}%` }}></div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.badgeClasses}`}>{status.text}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


// --- Componente Pagina Task ---
export default function Task({ projectId, onNavigate }) {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [currentView, setCurrentView] = useState('table');
    const [filters, setFilters] = useState({
        owner: 'all',
        startDate: '',
        endDate: '',
        showLate: false,
        showCritical: false,
    });
    const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'asc' });
    const ganttRef = useRef(null);

    // 1. Carica e processa i dati una sola volta
    useEffect(() => {
        const today = dayjs().startOf('day');
        const projectTasks = allTasksData
            .filter(t => t.Progetto === projectId)
            .map(row => {
                const deadline = parseItalianDate(row.Deadline);
                return {
                    id: row.ID,
                    title: row['Titolo Task'],
                    project: row.Progetto,
                    owner: row.Owner || 'Non assegnato',
                    startDate: parseItalianDate(row['Start Date']),
                    deadline,
                    status: row.Stato || 'Pianificato',
                    criticality: row.Criticità || 'Bassa',
                    completion: parsePercentage(row['% Completamento']),
                    isLate: deadline && deadline.isBefore(today) && row.Stato !== 'Completato',
                };
            }).filter(t => t.id && t.title && t.startDate && t.deadline);

        setTasks(projectTasks);
        if (projectTasks.length > 0) {
            setProjectName(projectTasks[0].project);
        }
    }, [projectId]);

    // 2. Applica filtri e ordinamento quando i dati o i filtri cambiano
    useEffect(() => {
        let processedTasks = [...tasks];

        // Applica filtri
        const { owner, startDate, endDate, showLate, showCritical } = filters;
        processedTasks = processedTasks.filter(task => {
            const ownerMatch = owner === 'all' || task.owner === owner;
            const lateMatch = !showLate || task.isLate;
            const criticalMatch = !showCritical || task.criticality === 'Alta';
            const startDateMatch = !startDate || task.startDate.isAfter(dayjs(startDate).subtract(1, 'day'));
            const endDateMatch = !endDate || task.deadline.isBefore(dayjs(endDate).add(1, 'day'));
            return ownerMatch && lateMatch && criticalMatch && startDateMatch && endDateMatch;
        });

        // Applica ordinamento
        processedTasks.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (sortConfig.key === 'criticality') {
                const order = { 'Alta': 0, 'Media': 1, 'Bassa': 2 };
                valA = order[valA]; valB = order[valB];
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredTasks(processedTasks);
    }, [tasks, filters, sortConfig]);

    // 3. Renderizza il Gantt quando necessario
    useEffect(() => {
        if (currentView === 'gantt' && ganttRef.current && filteredTasks.length > 0) {
            ganttRef.current.innerHTML = '';
            const ganttTasks = filteredTasks.map((task, i) => ({
                id: `task_${i}`,
                name: task.title,
                start: task.startDate.format('YYYY-MM-DD'),
                end: task.deadline.format('YYYY-MM-DD'),
                progress: task.completion,
                custom_class: `bar-${(task.isLate ? 'in-ritardo' : task.status.toLowerCase()).replace(' ', '-')}`
            }));
            new Gantt(ganttRef.current, ganttTasks, { language: 'it', view_mode: 'Week' });
        }
    }, [currentView, filteredTasks]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const uniqueOwners = useMemo(() => ['all', ...new Set(tasks.map(t => t.owner))], [tasks]);

    if (!projectId) {
        return <div className="p-8 text-center"><h2 className="text-xl font-bold">Nessun progetto selezionato</h2><button onClick={() => onNavigate('Progetti')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Torna ai Progetti</button></div>;
    }

    return (
        <div className="p-4 md:p-6">
            <button onClick={() => onNavigate('Progetti')} className="inline-flex items-center text-blue-600 font-semibold hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Progetti
            </button>
            <header><h1 className="text-3xl font-bold text-slate-900">Task Operativi</h1><p className="text-slate-600 mt-1">Dettaglio per il progetto: <span className="font-semibold">{projectName}</span></p></header>
            
            <div className="bg-white p-4 rounded-lg shadow-md my-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <select name="owner" value={filters.owner} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full">
                        {uniqueOwners.map(o => <option key={o} value={o}>{o === 'all' ? 'Tutti gli Owner' : o}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-slate-500">Da (Inizio)</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm"/></div>
                        <div><label className="text-xs text-slate-500">A (Fine)</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm"/></div>
                    </div>
                    <div className="flex items-center justify-end gap-4 col-span-1 md:col-span-2">
                        <div className="flex items-center"><input id="late" name="showLate" type="checkbox" checked={filters.showLate} onChange={handleFilterChange} className="h-4 w-4 rounded"/><label htmlFor="late" className="ml-2 text-sm">In Ritardo</label></div>
                        <div className="flex items-center"><input id="critical" name="showCritical" type="checkbox" checked={filters.showCritical} onChange={handleFilterChange} className="h-4 w-4 rounded"/><label htmlFor="critical" className="ml-2 text-sm">Criticità Alta 🔥</label></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Dettaglio Task</h2>
                <div className="flex items-center bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setCurrentView('table')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Tabella</button>
                    <button onClick={() => setCurrentView('gantt')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'gantt' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Timeline</button>
                </div>
            </div>

            {filteredTasks.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow"><p>Nessun task corrisponde ai filtri selezionati.</p></div>
            ) : (
                currentView === 'table' ? <TaskTable tasks={filteredTasks} onSort={handleSort} sortConfig={sortConfig} /> : <div className="bg-white p-4 rounded-lg shadow-md"><svg ref={ganttRef}></svg></div>
            )}
        </div>
    );
}
