import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type Role } from '@/hooks/use-auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/bookings', label: 'nav.bookings', roles: ['customer'] },
  { to: '/credits', label: 'nav.credits', roles: ['customer'] },
  { to: '/teacher/schedule', label: 'nav.teacherSchedule', roles: ['teacher'] },
  { to: '/admin', label: 'nav.dashboard', roles: ['tenant_admin'] },
  { to: '/admin/classes', label: 'nav.classes', roles: ['tenant_admin'] },
  { to: '/admin/schedule', label: 'nav.schedule', roles: ['tenant_admin'] },
  { to: '/admin/customers', label: 'nav.customers', roles: ['tenant_admin'] },
  { to: '/admin/pricing/packs', label: 'nav.pricing', roles: ['tenant_admin'] },
  { to: '/admin/reports', label: 'nav.reports', roles: ['tenant_admin'] },
  { to: '/admin/settings', label: 'nav.settings', roles: ['tenant_admin'] },
  { to: '/super/tenants', label: 'nav.tenants', roles: ['super_admin'] },
  { to: '/super/settings', label: 'nav.globalSettings', roles: ['super_admin'] },
];

export function AuthLayout() {
  const { t } = useTranslation();
  const { role } = useAuth();

  const visibleLinks = navItems.filter(
    (item) => role && item.roles.includes(role),
  );

  return (
    <div className="min-h-screen flex flex-col bg-[--color-background]">
      <header className="border-b border-[--color-border] bg-[--color-surface]">
        <nav className="max-w-[72rem] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg font-semibold text-[--color-text] shrink-0">
            {t('app.name', 'StudioBase')}
          </Link>
          <div className="hidden md:flex items-center gap-1 mx-4 overflow-x-auto">
            {visibleLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-250',
                    isActive
                      ? 'text-[--color-primary] bg-[--color-primary]/5'
                      : 'text-[--color-text-muted] hover:text-[--color-text] hover:bg-[--color-surface]',
                  )
                }
              >
                {t(item.label, item.label.split('.').pop() ?? '')}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <div className="max-w-[72rem] mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
