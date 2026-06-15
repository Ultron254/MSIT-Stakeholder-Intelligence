import { useAppStore, useCurrentUser } from './lib/store';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './pages/Login';
import ClientApp from './client/ClientApp';
import Dashboard from './pages/Dashboard';
import Stakeholders from './pages/Stakeholders';
import StakeholderDetail from './pages/StakeholderDetail';
import QuadrantMap from './pages/QuadrantMap';
import Engagements from './pages/Engagements';
import EngagementPlans from './pages/EngagementPlans';
import Watchlist from './pages/Watchlist';
import ScoringConfig from './pages/ScoringConfig';
import UsersAccess from './pages/UsersAccess';
import AddStakeholder from './pages/AddStakeholder';
import DataStreams from './pages/DataStreams';
import Campaigns from './pages/Campaigns';
import Approvals from './pages/Approvals';
import Clients from './pages/Clients';
import TeamActivity from './pages/TeamActivity';
import Partners from './pages/Partners';
import ScoreUpdatePanel from './components/ScoreUpdatePanel';
import EngagementDetailModal from './components/EngagementDetailModal';
import LogEngagementModal from './components/LogEngagementModal';
import EditUserModal from './components/EditUserModal';
import AddWatchlistModal from './components/AddWatchlistModal';
import { ToastContainer } from './components/ui/Badges';

function App() {
  const { currentPage, sidebarCollapsed } = useAppStore();
  const user = useCurrentUser();

  // Not signed in -> show the login experience.
  if (!user) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

  // Clients get a dedicated curated workspace, not the staff console.
  if (user.role === 'client') {
    return (
      <>
        <ClientApp />
        <ToastContainer />
      </>
    );
  }

  const mgmtPages = ['approvals', 'team-activity', 'clients', 'scoring-config', 'users'];
  const partnerPages = ['partners'];
  const isMgmt = user.role === 'lead' || user.role === 'partner' || user.role === 'admin';
  const isPartner = user.role === 'partner' || user.role === 'admin';
  const page =
    (mgmtPages.includes(currentPage) && !isMgmt) || (partnerPages.includes(currentPage) && !isPartner)
      ? 'dashboard'
      : currentPage;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'stakeholders': return <Stakeholders />;
      case 'stakeholder-detail': return <StakeholderDetail />;
      case 'quadrant-map': return <QuadrantMap />;
      case 'engagements': return <Engagements />;
      case 'engagement-plans': return <EngagementPlans />;
      case 'watchlist': return <Watchlist />;
      case 'scoring-config': return <ScoringConfig />;
      case 'users': return <UsersAccess />;
      case 'add-stakeholder': return <AddStakeholder />;
      case 'data-streams': return <DataStreams />;
      case 'campaigns': return <Campaigns />;
      case 'approvals': return <Approvals />;
      case 'clients': return <Clients />;
      case 'team-activity': return <TeamActivity />;
      case 'partners': return <Partners />;
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
          style={{ maxWidth: page === 'dashboard' ? 1680 : 1400 }}
        >
          {renderPage()}
        </main>
      </div>
      <ScoreUpdatePanel />
      <EngagementDetailModal />
      <LogEngagementModal />
      <EditUserModal />
      <AddWatchlistModal />
      <ToastContainer />
    </div>
  );
}

export default App;
