import React, { useState } from 'react';
import { LayoutDashboard, FolderKanban, Flag, ListChecks, Siren, GitPullRequestDraft, Gavel } from 'lucide-react';

// --- Placeholder per le Pagine ---
// Per ora, queste sono semplici funzioni che mostrano un titolo.
// Successivamente, le sostituiremo con i veri componenti delle pagine.
const Progetti = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Progetti</h1></div>;
const Milestone = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Milestone</h1></div>;
const Task = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Task</h1></div>;
const Imprevisti = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Imprevisti</h1></div>;
const Varianti = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Varianti</h1></div>;
const Decisioni = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Decisioni</h1></div>;
const Dashboard = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Dashboard Principale</h1></div>;


// --- Componente per una singola voce del menu ---
const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors
      ${active
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      }
    `}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

// --- Componente Principale App ---
export default function App() {
  // 'useState' tiene traccia di quale pagina è attualmente attiva.
  // Iniziamo con 'Progetti'.
  const [activePage, setActivePage] = useState('Progetti');

  // Definiamo le voci del menu di navigazione
  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, component: <Dashboard /> },
    { id: 'Progetti', label: 'Progetti', icon: <FolderKanban size={20} />, component: <Progetti /> },
    { id: 'Milestone', label: 'Milestone', icon: <Flag size={20} />, component: <Milestone /> },
    { id: 'Task', label: 'Task', icon: <ListChecks size={20} />, component: <Task /> },
    { id: 'Imprevisti', label: 'Imprevisti', icon: <Siren size={20} />, component: <Imprevisti /> },
    { id: 'Varianti', label: 'Varianti', icon: <GitPullRequestDraft size={20} />, component: <Varianti /> },
    { id: 'Decisioni', label: 'Decisioni', icon: <Gavel size={20} />, component: <Decisioni /> },
  ];

  // Funzione per mostrare il componente della pagina attiva
  const renderActivePage = () => {
    const activeItem = navItems.find(item => item.id === activePage);
    return activeItem ? activeItem.component : <Progetti />;
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar di Navigazione (a sinistra) */}
      <aside className="w-64 bg-white p-4 flex flex-col shadow-lg">
        <div className="flex items-center mb-8">
          {/* Qui puoi inserire il tuo logo */}
          <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <h1 className="text-xl font-bold ml-2 text-slate-800">Client Dashboard</h1>
        </div>
        
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activePage === item.id}
              onClick={() => setActivePage(item.id)}
            />
          ))}
        </nav>
        
        <div className="mt-auto text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Tua Azienda</p>
        </div>
      </aside>

      {/* Area Contenuto Principale (a destra) */}
      <main className="flex-1 overflow-y-auto">
        {/* Renderizza il componente della pagina attiva */}
        {renderActivePage()}
      </main>
    </div>
  );
}
// Layout + Routing principale
