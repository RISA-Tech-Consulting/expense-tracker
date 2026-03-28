import { useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/expenses', label: '💸 Expenses' },
  { to: '/insights', label: '🧾 Tax Insights' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = useCallback((to: string) => {
    setSidebarOpen(false);
    navigate(to);
  }, [navigate]);

  return (
    <div className="d-flex layout-shell">
      {/* Sidebar - Always visible on desktop */}
      <nav className="d-none d-md-flex flex-column layout-sidebar" id="sidebar">
        <div className="layout-sidebar-header">
          <h1 className="layout-sidebar-title">
            💰 ExpenseTracker
          </h1>
          <p className="layout-sidebar-subtitle">Tax insights & tracking</p>
        </div>
        <nav className="layout-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </nav>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="layout-mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <nav className={`layout-mobile-sidebar${sidebarOpen ? ' layout-mobile-sidebar-open' : ''}`}>
        <div className="layout-mobile-sidebar-top">
          <h5 className="layout-offcanvas-title">Menu</h5>
          <button
            type="button"
            className="layout-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="layout-mobile-sidebar-header">
          <h1 className="layout-mobile-sidebar-title">
            💰 ExpenseTracker
          </h1>
          <p className="layout-sidebar-subtitle">Tax insights & tracking</p>
        </div>
        <nav className="layout-mobile-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.to);
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 layout-main">
        {/* Top navbar for mobile - Hamburger menu only visible on mobile */}
        <nav className="navbar navbar-dark bg-dark d-md-none sticky-top">
          <div className="container-fluid">
            <button
              type="button"
              className="navbar-toggler layout-navbar-toggler"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <span className="navbar-brand mb-0 h5 ms-2 layout-navbar-brand">ExpenseTracker</span>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-grow-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
