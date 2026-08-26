import { useEffect, useState } from 'react';
import { useAuthStore } from './store/auth';
import { Login } from './views/Login';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './views/Dashboard';
import { Cases } from './views/Cases';
import { LegalMatch } from './views/LegalMatch';
import { AuditLogs } from './views/AuditLogs';
import { UserManagement } from './views/UserManagement';
import { LawLookupView } from './views/LawLookupView';
import { InvestigationHandbook } from './views/InvestigationHandbook';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedCaseIdForEvaluation, setSelectedCaseIdForEvaluation] = useState<number | null>(null);

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token, user]);

  const handleSelectEvaluate = (caseId: number) => {
    setSelectedCaseIdForEvaluation(caseId);
    setCurrentTab('legal-match');
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'cases':
        return <Cases onSelectEvaluate={handleSelectEvaluate} />;
      case 'laws-lookup':
        return <LawLookupView />;
      case 'legal-match':
        return (
          <LegalMatch 
            preselectedCaseId={selectedCaseIdForEvaluation} 
          />
        );
      case 'investigation-handbook':
        return <InvestigationHandbook />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderTabContent()}
    </MainLayout>
  );
}

export default App;
