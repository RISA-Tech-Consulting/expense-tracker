import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/expenses', label: '💸 Expenses' },
  { to: '/insights', label: '🧾 Tax Insights' },
];

export default function Layout() {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar - Offcanvas on mobile, fixed on desktop */}
      <nav
        className="offcanvas offcanvas-start d-md-flex flex-column"
        id="sidebar"
        style={{
          width: '240px',
          background: '#1E293B',
          color: '#fff',
          zIndex: 1040,
        }}
      >
        <div className="offcanvas-header d-md-none">
          <h5 className="offcanvas-title">Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>
        <div className="p-4 border-bottom" style={{ borderColor: '#334155' }}>
          <h1 className="mb-2" style={{ fontSize: '20px', fontWeight: 700, color: '#F1F5F9' }}>
            💰 ExpenseTracker
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>Tax insights & tracking</p>
        </div>
        <nav className="mt-3 flex-grow-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link d-block px-4 py-3 ${
                  isActive ? 'bg-primary text-white border-start border-4 border-info' : 'text-secondary'
                }`
              }
              style={{ textDecoration: 'none', fontSize: '14px' }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1" style={{ background: '#F8FAFC', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top navbar for mobile */}
        <div className="navbar navbar-expand-md navbar-dark bg-dark d-md-none sticky-top">
          <div className="container-fluid">
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebar"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <span className="navbar-brand mb-0 h1 ms-2">ExpenseTracker</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
