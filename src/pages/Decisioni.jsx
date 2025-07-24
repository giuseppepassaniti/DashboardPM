import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { ArrowLeft, Search, Gavel, CheckCircle, XCircle, Loader2, Info, Briefcase, User, Calendar, X } from 'lucide-react';

// 1. Importiamo i dati JSON
import allDecisionsData from '../data/decisioni.json';

// --- Mappature e Helper ---
const statusInfo = { 'Approvata': { badge: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle /> }, 'Rifiutata': { badge: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle /> }, 'In Valutazione': { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Loader2 /> }, 'Neutrale': { badge: 'bg-slate-100 text-slate-800 border-slate-300', icon: <Info /> } };
const getDecisionStatus = (motivation) => {
    const motivLower = motivation.toLowerCase();
    if (motivLower.includes('approvat')) return 'Approvata';
    if (motivLower.includes('rifiutat')) return 'Rifiutata';
    if (motivLower.includes('in valutazione') || motivLower.includes('sospesa')) return 'In Valutazione';
    return 'Neutrale';
};

// --- Componente Pagina Decisioni ---
export default function Decisioni({ projectId, onNavigate }) {
    const [decisions, setDecisions] = useState([]);
    const [filteredDecisions, setFilteredDecisions] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [currentView, setCurrentView] = useState('cards');
    const [filters, setFilters] = useState({
        responsabile: 'all',
        startDate: '',
        endDate: '',
        searchTerm: ''
    });
    const [modalData, setModalData] = useState(null);

    // 1. Carica e processa i dati una sola volta in base al projectId
    useEffect(() => {
        const projectDecisions = allDecisionsData
            .filter(d => d.Progetto === projectId)
            .map((row, index) => {
                const motivation = (row.Motivazione || 'Nessuna motivazione fornita.').replace(/\\n/g, '\n');
                return {
                    id: index,
                    decision: row.Decisione.replace(/\\n/g, ' '),
                    project: row.Progetto,
                    responsabile: row.Responsabile || 'Non specificato',
                    date: dayjs(row['Data Decisione'], 'DD/MM/YYYY'),
                    motivation: motivation,
                    status: getDecisionStatus(motivation),
                };
            });
        
        setDecisions(projectDecisions);
        if (projectDecisions.length > 0) {
            setProjectName(projectDecisions[0].project);
        }
    }, [projectId]);

    // 2. Applica filtri quando i dati o i filtri cambiano
    useEffect(() => {
        const { responsabile, startDate, endDate, searchTerm } = filters;
        const filtered = decisions.filter(d => {
            const responsabileMatch = responsabile === 'all' || d.responsabile === responsabile;
            const dateMatch = (!startDate || d.date.isAfter(dayjs(startDate).subtract(1, 'day'))) && (!endDate || d.date.isBefore(dayjs(endDate).add(1, 'day')));
            const searchMatch = !searchTerm || d.decision.toLowerCase().includes(searchTerm.toLowerCase()) || d.responsabile.toLowerCase().includes(searchTerm.toLowerCase());
            return responsabileMatch && dateMatch && searchMatch;
        });
        setFilteredDecisions(filtered);
    }, [decisions, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const uniqueResponsabili = useMemo(() => ['all', ...new Set(decisions.map(d => d.responsabile))], [decisions]);

    const kpis = useMemo(() => {
        const byStatus = filteredDecisions.reduce((acc, { status }) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return {
            total: filteredDecisions.length,
            approvate: byStatus['Approvata'] || 0,
            rifiutate: byStatus['Rifiutata'] || 0,
            inValutazione: byStatus['In Valutazione'] || 0,
        };
    }, [filteredDecisions]);

    if (!projectId) {
        return <div className="p-8 text-center"><h2 className="text-xl font-bold">Nessun progetto selezionato</h2><button onClick={() => onNavigate('Progetti')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Torna ai Progetti</button></div>;
    }

    return (
        <div className="p-4 md:p-6">
            <button onClick={() => onNavigate('Progetti')} className="inline-flex items-center text-blue-600 font-semibold hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Progetti
            </button>
            <header><h1 className="text-3xl font-bold text-slate-900">Log delle Decisioni</h1><p className="text-slate-600 mt-1">Dettaglio per il progetto: <span className="font-semibold">{projectName}</span></p></header>

            <div className="bg-white p-4 rounded-lg shadow-md my-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <select name="responsabile" value={filters.responsabile} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full"><option value="all">Tutti i Responsabili</option>{uniqueResponsabili.slice(1).map(r => <option key={r} value={r}>{r}</option>)}</select>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-slate-500">Da Data</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm mt-1"/></div>
                        <div><label className="text-xs text-slate-500">A Data</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm mt-1"/></div>
                    </div>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/><input type="text" name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Cerca..." className="w-full pl-10 p-2 border rounded-md bg-white shadow-sm"/></div>
                </div>
            </div>
            
            <section className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><Gavel className="h-10 w-10 text-blue-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Decisioni Totali</p><p className="text-2xl font-bold">{kpis.total}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><CheckCircle className="h-10 w-10 text-green-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Approvate</p><p className="text-2xl font-bold">{kpis.approvate}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><XCircle className="h-10 w-10 text-red-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Rifiutate</p><p className="text-2xl font-bold">{kpis.rifiutate}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><Loader2 className="h-10 w-10 text-yellow-500"/><div className="ml-4"><p className="text-slate-500 text-sm">In Valutazione</p><p className="text-2xl font-bold">{kpis.inValutazione}</p></div></div>
            </section>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Dettaglio Decisioni</h2>
                <div className="flex items-center bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setCurrentView('cards')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'cards' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Card</button>
                    <button onClick={() => setCurrentView('table')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Tabella</button>
                    <button onClick={() => setCurrentView('timeline')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Timeline</button>
                </div>
            </div>

            {filteredDecisions.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow"><p>Nessuna decisione corrisponde ai filtri.</p></div>
            ) : (
                <main>
                    {currentView === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filteredDecisions.map(d => <div key={d.id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${statusInfo[d.status]?.badge.split(' ')[2]}`}><div className="flex justify-between items-start"><h4 className="font-bold text-slate-800 pr-2">{d.decision}</h4><span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusInfo[d.status]?.badge}`}>{d.status}</span></div><div className="text-sm text-slate-500 mt-2"><p className="flex items-center"><User className="h-4 w-4 mr-2"/>{d.responsabile}</p><p className="flex items-center mt-1"><Calendar className="h-4 w-4 mr-2"/>{d.date.format('DD MMM YYYY')}</p></div><div className="mt-4 pt-3 border-t"><button className="text-sm text-blue-600 hover:underline font-semibold" onClick={() => setModalData(d)}>Leggi motivazione</button></div></div>)}</div>}
                    {currentView === 'table' && <div className="overflow-x-auto bg-white rounded-lg shadow"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Data', 'Decisione', 'Responsabile', 'Stato'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}<th></th></tr></thead><tbody className="divide-y divide-slate-200">{filteredDecisions.map(d => <tr key={d.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-sm">{d.date.format('DD/MM/YYYY')}</td><td className="px-4 py-3 text-sm">{d.decision}</td><td className="px-4 py-3 text-sm">{d.responsabile}</td><td className="px-4 py-3 text-sm"><span className={`font-semibold ${statusInfo[d.status]?.badge} px-2 py-1 rounded`}>{d.status}</span></td><td className="px-4 py-3 text-sm"><button className="text-blue-600 hover:underline" onClick={() => setModalData(d)}>Dettagli</button></td></tr>)}</tbody></table></div>}
                    {currentView === 'timeline' && <div className="space-y-8 relative p-4">{[...filteredDecisions].sort((a, b) => b.date - a.date).map(d => <div key={d.id} className="relative flex items-start timeline-item"><div className={`flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 ${statusInfo[d.status]?.badge.split(' ')[2]} flex items-center justify-center z-10`}>{React.cloneElement(statusInfo[d.status]?.icon, { className: `h-5 w-5 ${statusInfo[d.status]?.badge.split(' ')[1]}` })}</div><div className="ml-4 bg-white p-4 rounded-lg shadow-md flex-grow"><div className="flex justify-between items-center"><p className="font-bold">{d.decision}</p><span className="text-sm font-medium text-slate-500">{d.date.format('DD MMMM YYYY')}</span></div><p className="text-sm text-slate-600">{d.responsabile}</p><button className="text-sm text-blue-600 hover:underline mt-2" onClick={() => setModalData(d)}>Leggi motivazione</button></div></div>)}</div>}
                </main>
            )}

            {modalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setModalData(null)}></div>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl z-10"><div className="p-6"><div className="flex justify-between items-start"><div><h3 className="text-2xl font-bold text-slate-900">{modalData.decision}</h3><p className="text-sm text-slate-500">{modalData.project} | {modalData.responsabile} | {modalData.date.format('DD MMMM YYYY')}</p></div><button onClick={() => setModalData(null)} className="p-1 rounded-full hover:bg-slate-200"><X className="h-6 w-6 text-slate-600" /></button></div><div className="mt-4 border-t pt-4"><h4 className="font-semibold text-slate-800 mb-2">Motivazione:</h4><p className="text-slate-700 whitespace-pre-wrap">{modalData.motivation}</p></div></div></div>
                </div>
            )}
        </div>
    );
}
// Pagina decision log
