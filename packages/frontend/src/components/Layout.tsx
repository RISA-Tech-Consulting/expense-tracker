import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/expenses', label: '💸 Expenses' },
  { to: '/insights', label: '🧾 Tax Insights' },
];

export default function Layout() {
  return (
    <div className="d-flex layout-shell">
      {/* Sidebar - Always visible on desktop, offcanvas on mobile */}
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

      {/* Mobile sidebar - Offcanvas drawer */}
      <nav className="offcanvas offcanvas-start d-md-none layout-mobile-sidebar" id="mobileSidebar">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title layout-offcanvas-title">Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
          ></button>
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
              data-bs-dismiss="offcanvas"
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
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-controls="mobileSidebar"
              aria-expanded="false"
              aria-label="Toggle navigation"
              className="navbar-toggler layout-navbar-toggler"
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
