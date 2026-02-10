import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, ArrowLeftRight, CreditCard, Target, BarChart3, LogOut, Menu, X } from 'lucide-react';

function Layout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1>💰 KaSh</h1>
        </div>
        <div className="user-info">
          <span>{user?.email || user?.first_name || 'User'}</span>
          <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            <span style={{ display: 'inline' }}>Logout</span>
          </button>
        </div>
      </header>

      <div className="layout-container">
        {/* Overlay for mobile */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav>
            <NavLink to="/" end>
              <Home size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/transactions">
              <ArrowLeftRight size={20} />
              Transactions
            </NavLink>
            <NavLink to="/accounts">
              <CreditCard size={20} />
              Accounts
            </NavLink>
            <NavLink to="/budgets">
              <Target size={20} />
              Budgets
            </NavLink>
            <NavLink to="/reports">
              <BarChart3 size={20} />
              Reports
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
