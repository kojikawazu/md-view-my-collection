
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ESPRESSO_THEME, INITIAL_REPORTS } from './constants';
import { ReportItem, User } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';

const App: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = ESPRESSO_THEME;

  // Persistence (Simulated)
  useEffect(() => {
    const savedReports = localStorage.getItem('espresso_reports');
    if (savedReports) setReports(JSON.parse(savedReports));
    
    const savedUser = localStorage.getItem('espresso_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem('espresso_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('espresso_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  const addReport = (report: Omit<ReportItem, 'id'>) => {
    const newReport = { ...report, id: Date.now().toString() };
    setReports([newReport, ...reports]);
    navigate('/');
  };

  const updateReport = (id: string, updatedData: Partial<ReportItem>) => {
    setReports(reports.map(r => r.id === id ? { ...r, ...updatedData } : r));
    navigate(`/report/${id}`);
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login';

  const renderLayout = (content: React.ReactNode) => {
    if (isAuthPage) return content;

    return (
      <div className={`${theme.colors.background} ${theme.fontPrimary} ${theme.colors.text} min-h-screen flex flex-col`}>
        <Header theme={theme} user={currentUser} onLogout={handleLogout} />
        {/* Increased padding-top from pt-16 to pt-24 */}
        <div className="flex flex-1 pt-24">
          <Sidebar theme={theme} />
          <main className="flex-1 overflow-x-hidden">
            {content}
            <Footer theme={theme} />
          </main>
        </div>
      </div>
    );
  };

  return renderLayout(
    <Routes>
      <Route path="/" element={<ListPage theme={theme} reports={reports} />} />
      <Route path="/report/:id" element={<DetailPage theme={theme} reports={reports} user={currentUser} onDelete={deleteReport} />} />
      <Route path="/report/new" element={<FormPage theme={theme} onSubmit={addReport} user={currentUser} />} />
      <Route path="/report/:id/edit" element={<FormPage theme={theme} reports={reports} onSubmit={(data) => {
        const id = location.pathname.split('/')[2];
        updateReport(id, data);
      }} user={currentUser} />} />
      <Route path="/login" element={<LoginPage theme={theme} onLogin={handleLogin} />} />
    </Routes>
  );
};

export default App;
