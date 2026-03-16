import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface SubNavConfig {
  prefix: string;
  items: { to: string; label: string }[];
}

const subNavs: SubNavConfig[] = [
  {
    prefix: '/admin/pricing',
    items: [
      { to: '/admin/pricing/packs', label: 'admin.packs' },
      { to: '/admin/pricing/subscriptions', label: 'admin.subscriptions' },
    ],
  },
];

export function AdminSubNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const activeSubNav = subNavs.find((sn) => pathname.startsWith(sn.prefix));
  if (!activeSubNav) return null;

  return (
    <div className="border-b border-[--color-border] bg-[--color-surface]/50">
      <div className="max-w-[72rem] mx-auto px-4 sm:px-6 flex gap-1">
        {activeSubNav.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-250',
                isActive
                  ? 'text-[--color-primary] border-[--color-primary]'
                  : 'text-[--color-text-muted] border-transparent hover:text-[--color-text]',
              )
            }
          >
            {t(item.label, item.label.split('.').pop() ?? '')}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <>
      <AdminSubNav />
      <Outlet />
    </>
  );
}
