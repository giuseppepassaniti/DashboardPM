import React, { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import Chart from 'chart.js/auto';
import { ArrowLeft, ListTodo, Circle, Search, AlertOctagon, AlertTriangle, ShieldCheck, FolderOpen, Loader2, CheckCircle, X } from 'lucide-react';

// 1. Importiamo i dati JSON
import allIncidentsData from '../data/imprevisti.json';

// --- Mappature e Helper ---
const criticalityInfo = { 'Alta': { icon: <AlertOctagon />, badge: 'border-red-500 text-red-600 bg-red-100' }, 'Media': { icon: <AlertTriangle />, badge: 'border-orange-500 text-orange-600 bg-orange-100' }, 'Bassa': { icon: <ShieldCheck />, badge: 'border-green-500 text-green-600 bg-green-100' }, 'Default': { icon: <ShieldCheck />, badge: 'border-slate-400 text-slate-500 bg-slate-100' } };
const statusInfo = { 'Aperto': { icon: <FolderOpen />, badge: 'bg-red-100 text-red-800' }, 'In lavorazione': { icon: <Loader2 />, badge: 'bg-yellow-100 text-yellow-800' }, 'Risolto': { icon: <CheckCircle />, badge: 'bg-green-100 text-green-800' }, 'Default': { icon: <CheckCircle />, badge: 'bg-slate-100 text-slate-800' } };

// --- Componente Pagina Imprevisti ---
export default function Imprevisti({ projectId, onNavigate }) {
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [currentView, setCurrentView] = useState('cards');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        statuses: [],
        criticalities: [],
        searchTerm: ''
    });
    const [modalData, setModalData] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // 1. Carica e processa i dati una sola volta
    useEffect(() => {
        const projectIncidents = allIncidentsData
            .filter(i => i.Progetto === projectId)
            .map((row, index) => ({
                id: index,
                title: row['Titolo Imprevisto'],
                project: row.Progetto,
                description: row['Descrizione Problema'] || 'Nessuna descrizione fornita.',
                type: row.Tipo || 'Non specificato',
                criticality: row.Criticità || 'Bassa',
                date: dayjs(row['Data Imprevisti'], 'DD/MM/YYYY'),
                status: row.Stato || 'Aperto',
                risk: row['Rischio Previsionale'] || 'Non definito',
            }));
        
        setIncidents(projectIncidents);
        if (projectIncidents.length > 0) {
            setProjectName(projectIncidents[0].project);
        }
    }, [projectId]);

    // 2. Applica filtri quando i dati o i filtri cambiano
    useEffect(() => {
        const { startDate, endDate, statuses, criticalities, searchTerm } = filters;
        const filtered = incidents.filter(incident => {
            const dateMatch = (!startDate || incident.date.isAfter(dayjs(startDate).subtract(1, 'day'))) && (!endDate || incident.date.isBefore(dayjs(endDate).add(1, 'day')));
            const statusMatch = statuses.length === 0 || statuses.includes(incident.status);
            const criticalityMatch = criticalities.length === 0 || criticalities.includes(incident.criticality);
            const searchMatch = !searchTerm || incident.title.toLowerCase().includes(searchTerm.toLowerCase()) || incident.type.toLowerCase().includes(searchTerm.toLowerCase());
            return dateMatch && statusMatch && criticalityMatch && searchMatch;
        });
        setFilteredIncidents(filtered);
    }, [incidents, filters]);
    
    // 3. Renderizza il grafico quando i dati filtrati cambiano
    useEffect(() => {
        if (chartRef.current && filteredIncidents.length > 0) {
            const byType = filteredIncidents.reduce((acc, { type }) => {
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            chartInstance.current = new Chart(chartRef.current, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(byType),
                    datasets: [{
                        data: Object.values(byType),
                        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
                        title: { display: true, text: 'Imprevisti per Tipo' }
                    }
                }
            });
        }
    }, [filteredIncidents]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            const filterArray = filters[name];
            const newArray = checked ? [...filterArray, value] : filterArray.filter(item => item !== value);
            setFilters(prev => ({ ...prev, [name]: newArray }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const uniqueStatuses = useMemo(() => [...new Set(incidents.map(i => i.status))], [incidents]);
    const uniqueCriticalities = useMemo(() => [...new Set(incidents.map(i => i.criticality))], [incidents]);

    const kpis = useMemo(() => {
        const byStatus = filteredIncidents.reduce((acc, { status }) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return {
            total: filteredIncidents.length,
            open: byStatus['Aperto'] || 0,
            inProgress: byStatus['In lavorazione'] || 0,
            resolved: byStatus['Risolto'] || 0,
        };
    }, [filteredIncidents]);

    if (!projectId) {
        return <div className="p-8 text-center"><h2 className="text-xl font-bold">Nessun progetto selezionato</h2><button onClick={() => onNavigate('Progetti')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Torna ai Progetti</button></div>;
    }

    return (
        <div className="p-4 md:p-6">
            <button onClick={() => onNavigate('Progetti')} className="inline-flex items-center text-blue-600 font-semibold hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Progetti
            </button>
            <header><h1 className="text-3xl font-bold text-slate-900">Dashboard Imprevisti</h1><p className="text-slate-600 mt-1">Dettaglio per il progetto: <span className="font-semibold">{projectName}</span></p></header>

            <div className="bg-white p-4 rounded-lg shadow-md my-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    <div><label className="text-xs font-semibold text-slate-500">Date Imprevisto</label><div className="grid grid-cols-2 gap-2 mt-1">
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm"/>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm"/>
                    </div></div>
                    <div><label className="text-xs font-semibold text-slate-500">Stato</label><div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        {uniqueStatuses.map(s => <div key={s} className="flex items-center"><input type="checkbox" id={`s-${s}`} name="statuses" value={s} onChange={handleFilterChange} className="h-4 w-4 rounded"/><label htmlFor={`s-${s}`} className="ml-2 text-sm">{s}</label></div>)}
                    </div></div>
                    <div><label className="text-xs font-semibold text-slate-500">Criticità</label><div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        {uniqueCriticalities.map(c => <div key={c} className="flex items-center"><input type="checkbox" id={`c-${c}`} name="criticalities" value={c} onChange={handleFilterChange} className="h-4 w-4 rounded"/><label htmlFor={`c-${c}`} className="ml-2 text-sm">{c}</label></div>)}
                    </div></div>
                </div>
            </div>
            
            <section className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><ListTodo className="h-10 w-10 text-blue-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Totale Imprevisti</p><p className="text-2xl font-bold">{kpis.total}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><FolderOpen className="h-10 w-10 text-red-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Aperti</p><p className="text-2xl font-bold">{kpis.open}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><Loader2 className="h-10 w-10 text-yellow-500"/><div className="ml-4"><p className="text-slate-500 text-sm">In Lavorazione</p><p className="text-2xl font-bold">{kpis.inProgress}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><CheckCircle className="h-10 w-10 text-green-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Risolti</p><p className="text-2xl font-bold">{kpis.resolved}</p></div></div>
            </section>

            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setCurrentView('cards')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'cards' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Card</button>
                    <button onClick={() => setCurrentView('table')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Tabella</button>
                    <button onClick={() => setCurrentView('timeline')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Timeline</button>
                </div>
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>
                    <input type="text" name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Cerca per titolo, tipo..." className="w-full pl-10 p-2 border rounded-md bg-white shadow-sm"/>
                </div>
            </div>

            {filteredIncidents.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow"><p>Nessun imprevisto corrisponde ai filtri.</p></div>
            ) : (
                <main>
                    {currentView === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filteredIncidents.map(i => <div key={i.id} onClick={() => setModalData(i)} className={`bg-white rounded-lg shadow p-4 border-l-4 ${criticalityInfo[i.criticality]?.badge.split(' ')[0]} cursor-pointer`}><div className="flex justify-between items-start"><h4 className="font-bold text-slate-800">{i.title}</h4><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo[i.status]?.badge}`}>{i.status}</span></div><p className="text-sm text-slate-500 mt-1">{i.type}</p><div className="mt-3 pt-3 border-t flex justify-between items-center text-sm"><span className="text-slate-600">{i.date.format('DD MMM YYYY')}</span><span className={`font-semibold px-2 py-1 rounded ${criticalityInfo[i.criticality]?.badge}`}>{i.criticality}</span></div></div>)}</div>}
                    {currentView === 'table' && <div className="overflow-x-auto bg-white rounded-lg shadow"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Titolo', 'Tipo', 'Criticità', 'Stato', 'Data', 'Rischio'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{filteredIncidents.map(i => <tr key={i.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium">{i.title}</td><td className="px-4 py-3 text-sm">{i.type}</td><td className="px-4 py-3 text-sm"><span className={`font-semibold ${criticalityInfo[i.criticality]?.badge} px-2 py-1 rounded`}>{i.criticality}</span></td><td className="px-4 py-3 text-sm"><span className={`font-semibold ${statusInfo[i.status]?.badge} px-2 py-1 rounded`}>{i.status}</span></td><td className="px-4 py-3 text-sm">{i.date.format('DD/MM/YYYY')}</td><td className="px-4 py-3 text-sm">{i.risk}</td></tr>)}</tbody></table></div>}
                    {currentView === 'timeline' && <div className="space-y-8 relative p-4">{[...filteredIncidents].sort((a, b) => b.date - a.date).map(i => <div key={i.id} className="relative flex items-start timeline-item"><div className={`flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 ${criticalityInfo[i.criticality]?.badge.split(' ')[0]} flex items-center justify-center z-10`}>{React.cloneElement(criticalityInfo[i.criticality]?.icon, { className: `h-5 w-5 ${criticalityInfo[i.criticality]?.badge.split(' ')[1]}` })}</div><div className="ml-4 bg-white p-4 rounded-lg shadow-md flex-grow"><div className="flex justify-between items-center"><p className="font-bold">{i.title}</p><span className="text-sm font-medium text-slate-500">{i.date.format('DD MMMM YYYY')}</span></div><p className="text-sm text-slate-600">{i.project} &bull; {i.type}</p><button className="text-sm text-blue-600 hover:underline mt-2" onClick={() => setModalData(i)}>Leggi descrizione</button></div></div>)}</div>}
                </main>
            )}

            {modalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setModalData(null)}></div>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl z-10">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div><h3 className="text-2xl font-bold text-slate-900">{modalData.title}</h3><p className="text-sm text-slate-500">{modalData.project}</p></div>
                                <button onClick={() => setModalData(null)} className="p-1 rounded-full hover:bg-slate-200"><X className="h-6 w-6 text-slate-600" /></button>
                            </div>
                            <div className="mt-4 border-t pt-4"><p className="text-slate-700 whitespace-pre-wrap">{modalData.description}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// Pagina imprevisti
