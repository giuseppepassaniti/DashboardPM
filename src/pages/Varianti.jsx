import React, { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import Chart from 'chart.js/auto';
import { ArrowLeft, GitPullRequestDraft, CalendarDays, Coins, Search, X } from 'lucide-react';

// 1. Importiamo i dati JSON
import allVariantsData from '../data/varianti.json';

// --- Funzioni di Utility ---
const parseCurrency = (str) => typeof str === 'string' ? parseFloat(str.replace(/[.€\s]/g, '').replace(',', '.')) || 0 : 0;
const parseDays = (str) => typeof str === 'string' ? parseInt(str.replace('+', ''), 10) || 0 : 0;
const formatCurrency = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
const formatDays = (value) => `${value > 0 ? '+' : ''}${value} giorni`;

// --- Componente Pagina Varianti ---
export default function Varianti({ projectId, onNavigate }) {
    const [variants, setVariants] = useState([]);
    const [filteredVariants, setFilteredVariants] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [currentView, setCurrentView] = useState('cards');
    const [filters, setFilters] = useState({
        variantType: 'all',
        status: 'all',
        timeImpact: 'all',
        costImpact: 'all',
        searchTerm: ''
    });
    const [modalData, setModalData] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // 1. Carica e processa i dati una sola volta in base al projectId
    useEffect(() => {
        const projectVariants = allVariantsData
            .filter(v => v.Progetto === projectId)
            .map((row, index) => ({
                id: index,
                type: (row.Variante || '').trim(),
                project: row.Progetto,
                date: dayjs(row['Data Variante'], 'DD/MM/YYYY'),
                description: row['Descrizione Variante'] || 'Nessuna descrizione.',
                timeImpact: parseDays(row['Impatto Tempi (in giorni)']),
                costImpact: parseCurrency(row['Impatto Costi']),
                status: row.Stato || 'In valutazione',
            }));
        
        setVariants(projectVariants);
        if (projectVariants.length > 0) {
            setProjectName(projectVariants[0].project);
        }
    }, [projectId]);

    // 2. Applica filtri quando i dati o i filtri cambiano
    useEffect(() => {
        const { variantType, status, timeImpact, costImpact, searchTerm } = filters;
        const filtered = variants.filter(v => {
            const typeMatch = variantType === 'all' || v.type === variantType;
            const statusMatch = status === 'all' || v.status === status;
            const timeMatch = (timeImpact === 'all') || (timeImpact === 'positive' && v.timeImpact < 0) || (timeImpact === 'negative' && v.timeImpact > 0) || (timeImpact === 'zero' && v.timeImpact === 0);
            const costMatch = (costImpact === 'all') || (costImpact === 'positive' && v.costImpact < 0) || (costImpact === 'negative' && v.costImpact > 0) || (costImpact === 'zero' && v.costImpact === 0);
            const searchMatch = !searchTerm || v.type.toLowerCase().includes(searchTerm.toLowerCase()) || v.project.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && statusMatch && timeMatch && costMatch && searchMatch;
        });
        setFilteredVariants(filtered);
    }, [variants, filters]);

    // 3. Renderizza il grafico quando i dati filtrati cambiano
    useEffect(() => {
        if (chartRef.current && filteredVariants.length > 0) {
            const byStatus = filteredVariants.reduce((acc, { status }) => {
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            chartInstance.current = new Chart(chartRef.current, {
                type: 'bar',
                data: {
                    labels: ['Approvate', 'Rifiutate', 'In Valutazione'],
                    datasets: [{
                        label: 'Numero di Varianti',
                        data: [byStatus['Approvata'] || 0, byStatus['Rifiutata'] || 0, byStatus['In valutazione'] || 0],
                        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false }, title: { display: true, text: 'Varianti per Stato' } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }
    }, [filteredVariants]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const uniqueTypes = useMemo(() => ['all', ...new Set(variants.map(v => v.type))], [variants]);
    const uniqueStatuses = useMemo(() => ['all', ...new Set(variants.map(v => v.status))], [variants]);

    const kpis = useMemo(() => ({
        total: filteredVariants.length,
        totalTimeImpact: filteredVariants.reduce((sum, v) => sum + v.timeImpact, 0),
        totalCostImpact: filteredVariants.reduce((sum, v) => sum + v.costImpact, 0),
    }), [filteredVariants]);

    if (!projectId) {
        return <div className="p-8 text-center"><h2 className="text-xl font-bold">Nessun progetto selezionato</h2><button onClick={() => onNavigate('Progetti')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Torna ai Progetti</button></div>;
    }

    return (
        <div className="p-4 md:p-6">
            <button onClick={() => onNavigate('Progetti')} className="inline-flex items-center text-blue-600 font-semibold hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Progetti
            </button>
            <header><h1 className="text-3xl font-bold text-slate-900">Dashboard Varianti Progettuali</h1><p className="text-slate-600 mt-1">Dettaglio per il progetto: <span className="font-semibold">{projectName}</span></p></header>

            <div className="bg-white p-4 rounded-lg shadow-md my-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                    <select name="variantType" value={filters.variantType} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full"><option value="all">Tutti i Tipi</option>{uniqueTypes.slice(1).map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full"><option value="all">Tutti gli Stati</option>{uniqueStatuses.slice(1).map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <div><label className="text-xs text-slate-500">Impatto Tempi</label><select name="timeImpact" value={filters.timeImpact} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm mt-1"><option value="all">Tutti</option><option value="positive">Positivo</option><option value="negative">Negativo</option><option value="zero">Nullo</option></select></div>
                    <div><label className="text-xs text-slate-500">Impatto Costi</label><select name="costImpact" value={filters.costImpact} onChange={handleFilterChange} className="p-2 border rounded-md bg-white shadow-sm w-full text-sm mt-1"><option value="all">Tutti</option><option value="positive">Positivo</option><option value="negative">Negativo</option><option value="zero">Nullo</option></select></div>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/><input type="text" name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Cerca..." className="w-full pl-10 p-2 border rounded-md bg-white shadow-sm"/></div>
                </div>
            </div>
            
            <section className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><GitPullRequestDraft className="h-10 w-10 text-blue-500"/><div className="ml-4"><p className="text-slate-500 text-sm">Totale Varianti</p><p className="text-2xl font-bold">{kpis.total}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><CalendarDays className={`h-10 w-10 ${kpis.totalTimeImpact > 0 ? 'text-red-500' : 'text-green-500'}`}/><div className="ml-4"><p className="text-slate-500 text-sm">Impatto Tempi Totale</p><p className="text-2xl font-bold">{formatDays(kpis.totalTimeImpact)}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center"><Coins className={`h-10 w-10 ${kpis.totalCostImpact > 0 ? 'text-red-500' : 'text-green-500'}`}/><div className="ml-4"><p className="text-slate-500 text-sm">Impatto Costi Totale</p><p className="text-2xl font-bold">{formatCurrency(kpis.totalCostImpact)}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-md"><canvas ref={chartRef}></canvas></div>
            </section>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Dettaglio Varianti</h2>
                <div className="flex items-center bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setCurrentView('cards')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'cards' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Card</button>
                    <button onClick={() => setCurrentView('table')} className={`px-4 py-1 text-sm font-semibold rounded-md ${currentView === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>Tabella</button>
                </div>
            </div>

            {filteredVariants.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow"><p>Nessuna variante corrisponde ai filtri.</p></div>
            ) : (
                currentView === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filteredVariants.map(v => <div key={v.id} onClick={() => setModalData(v)} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between cursor-pointer"><div><div className="flex justify-between items-start"><h4 className="font-bold text-slate-800 pr-2">{v.type}</h4><span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusInfo[v.status]?.badge}`}>{v.status}</span></div><p className="text-sm text-slate-500 mt-1">{v.date.format('DD MMM YYYY')}</p></div><div className="mt-4 pt-3 border-t space-y-2 text-sm"><p className="flex justify-between"><span>Impatto Tempi:</span> <span className={`font-bold ${v.timeImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatDays(v.timeImpact)}</span></p><p className="flex justify-between"><span>Impatto Costi:</span> <span className={`font-bold ${v.costImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(v.costImpact)}</span></p></div></div>)}</div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Variante', 'Data', 'Impatto Tempi', 'Impatto Costi', 'Stato'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{filteredVariants.map(v => <tr key={v.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-sm">{v.type}</td><td className="px-4 py-3 text-sm">{v.date.format('DD/MM/YYYY')}</td><td className={`px-4 py-3 text-sm font-bold ${v.timeImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatDays(v.timeImpact)}</td><td className={`px-4 py-3 text-sm font-bold ${v.costImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(v.costImpact)}</td><td className="px-4 py-3 text-sm"><span className={`font-semibold ${statusInfo[v.status]?.badge} px-2 py-1 rounded`}>{v.status}</span></td></tr>)}</tbody></table></div>
                )
            )}

            {modalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setModalData(null)}></div>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl z-10"><div className="p-6"><div className="flex justify-between items-start"><div><h3 className="text-2xl font-bold text-slate-900">{modalData.type}</h3><p className="text-sm text-slate-500">{modalData.project}</p></div><button onClick={() => setModalData(null)} className="p-1 rounded-full hover:bg-slate-200"><X className="h-6 w-6 text-slate-600" /></button></div><div className="mt-4 border-t pt-4"><p className="text-slate-700 whitespace-pre-wrap">{modalData.description}</p></div></div></div>
                </div>
            )}
        </div>
    );
}
// Pagina varianti
