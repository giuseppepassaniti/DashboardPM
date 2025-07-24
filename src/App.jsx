import React, { useState } from 'react';
import { LayoutDashboard, FolderKanban, Flag, ListChecks, Siren, GitPullRequestDraft, Gavel } from 'lucide-react';

// --- 1. Importiamo TUTTI i nostri componenti pagina reali ---
import Progetti from './pages/Progetti.jsx';
import Milestone from './pages/Milestone.jsx';
import Task from './pages/Task.jsx';
import Imprevisti from './pages/Imprevisti.jsx';
import Varianti from './pages/Varianti.jsx';
import Decisioni from './pages/Decisioni.jsx';

// --- Placeholder solo per la Dashboard principale (se vuoi crearla in futuro) ---
const Dashboard = () => <div className="p-8"><h1 className="text-3xl font-bold">Pagina Dashboard Principale</h1><p className="mt-2 text-slate-500">Questa pagina può contenere un riassunto di tutti i progetti.</p></div>;

// --- Componente per una singola voce del menu ---
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

// --- Componente Principale App ---
export default function App() {
  const [activePage, setActivePage] = useState('Progetti');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Funzione di navigazione che gestisce il cambio di pagina e la selezione del progetto
  const handleNavigate = (page, projectId = null) => {
    setActivePage(page);
    setSelectedProjectId(projectId);
  };

  // 2. Definiamo le voci del menu usando i componenti reali
  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, component: <Dashboard /> },
    { id: 'Progetti', label: 'Progetti', icon: <FolderKanban size={20} />, component: <Progetti onNavigate={handleNavigate} /> },
    { id: 'Milestone', label: 'Milestone', icon: <Flag size={20} />, component: <Milestone projectId={selectedProjectId} onNavigate={handleNavigate} /> },
    { id: 'Task', label: 'Task', icon: <ListChecks size={20} />, component: <Task projectId={selectedProjectId} onNavigate={handleNavigate} /> },
    { id: 'Imprevisti', label: 'Imprevisti', icon: <Siren size={20} />, component: <Imprevisti projectId={selectedProjectId} onNavigate={handleNavigate} /> },
    { id: 'Varianti', label: 'Varianti', icon: <GitPullRequestDraft size={20} />, component: <Varianti projectId={selectedProjectId} onNavigate={handleNavigate} /> },
    { id: 'Decisioni', label: 'Decisioni', icon: <Gavel size={20} />, component: <Decisioni projectId={selectedProjectId} onNavigate={handleNavigate} /> },
  ];

  // Funzione che decide quale componente visualizzare
  const renderActivePage = () => {
    // Se un progetto è stato selezionato, mostra la pagina corrispondente
    if (selectedProjectId && activePage !== 'Progetti') {
        const activeItem = navItems.find(item => item.id === activePage);
        return activeItem ? activeItem.component : <Progetti onNavigate={handleNavigate} />;
    }
    // Altrimenti, mostra la pagina cliccata dalla sidebar (o Progetti di default)
    const activeItem = navItems.find(item => item.id === activePage);
    return activeItem ? activeItem.component : <Progetti onNavigate={handleNavigate} />;
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <aside className="w-64 bg-white p-4 flex flex-col shadow-lg">
        <div className="flex items-center mb-8">
          <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          <h1 className="text-xl font-bold ml-2 text-slate-800">Client Dashboard</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activePage === item.id && !selectedProjectId} // La voce è attiva solo se non siamo in una sotto-pagina
              onClick={() => handleNavigate(item.id)} // Cliccando sulla sidebar si resetta il progetto
            />
          ))}
        </nav>
        <div className="mt-auto text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Tua Azienda</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {renderActivePage()}
      </main>
    </div>
  );
}
