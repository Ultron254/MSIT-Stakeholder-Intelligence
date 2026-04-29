import { useAppStore } from './lib/store';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Stakeholders from './pages/Stakeholders';
import StakeholderDetail from './pages/StakeholderDetail';
import QuadrantMap from './pages/QuadrantMap';
import Engagements from './pages/Engagements';
import EngagementPlans from './pages/EngagementPlans';
import Watchlist from './pages/Watchlist';
import ScoringConfig from './pages/ScoringConfig';
import UsersAccess from './pages/UsersAccess';
import ScoreUpdatePanel from './components/ScoreUpdatePanel';
import { ToastContainer } from './components/ui/Badges';

function App() {
  const { currentPage, sidebarCollapsed } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'stakeholders': return <Stakeholders />;
      case 'stakeholder-detail': return <StakeholderDetail />;
      case 'quadrant-map': return <QuadrantMap />;
      case 'engagements': return <Engagements />;
      case 'engagement-plans': return <EngagementPlans />;
      case 'watchlist': return <Watchlist />;
      case 'scoring-config': return <ScoringConfig />;
      case 'users': return <UsersAccess />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-250"
        style={{ marginLeft: sidebarCollapsed ? 64 : 260 }}
      >
        <Header />
        <main
          className="flex-1 px-6 py-5 w-full mx-auto"
          style={{ maxWidth: currentPage === 'dashboard' ? 1680 : 1400 }}
        >
          {renderPage()}
        </main>
      </div>
      <ScoreUpdatePanel />
      <ToastContainer />
    </div>
  );
}

export default App;