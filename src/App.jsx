import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Centros from './pages/Centros';
import Historial from './pages/Historial';
import Equipos2 from './pages/Equipos2';
import Actividades from './pages/Actividades';
import AlertasV2 from './pages/AlertasV2';
import SolicitudesV2 from './pages/SolicitudesV2';
import Reportes from './pages/Reportes';
const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Centros" element={<LayoutWrapper currentPageName="Centros"><Centros /></LayoutWrapper>} />
      <Route path="/Historial" element={<LayoutWrapper currentPageName="Historial"><Historial /></LayoutWrapper>} />
      <Route path="/Equipos2" element={<LayoutWrapper currentPageName="Equipos2"><Equipos2 /></LayoutWrapper>} />
      <Route path="/Actividades" element={<LayoutWrapper currentPageName="Actividades"><Actividades /></LayoutWrapper>} />
      <Route path="/AlertasV2" element={<LayoutWrapper currentPageName="AlertasV2"><AlertasV2 /></LayoutWrapper>} />
      <Route path="/SolicitudesV2" element={<LayoutWrapper currentPageName="SolicitudesV2"><SolicitudesV2 /></LayoutWrapper>} />
      <Route path="/Reportes" element={<LayoutWrapper currentPageName="Reportes"><Reportes /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App