import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/expenses', label: '💸 Expenses' },
  { to: '/insights', label: '🧾 Tax Insights' },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{
        width: 240,
        background: '#1E293B',
        color: '#fff',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #334155' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>
            💰 ExpenseTracker
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>Tax insights & tracking</p>
        </div>
        <nav style={{ marginTop: 16 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '12px 24px',
                color: isActive ? '#fff' : '#94A3B8',
                background: isActive ? '#3B82F6' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '3px solid #60A5FA' : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, background: '#F8FAFC', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
