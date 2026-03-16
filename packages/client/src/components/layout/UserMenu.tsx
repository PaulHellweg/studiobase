import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { ChevronDown, User, LogOut } from 'lucide-react';

export function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm hover:bg-[--color-surface] px-2 py-1 transition-colors duration-250"
      >
        <span className="inline-flex items-center justify-center w-7 h-7 bg-[--color-primary] text-white text-xs font-semibold rounded-none">
          {initials}
        </span>
        <span className="hidden md:inline text-[--color-text]">{user.name}</span>
        <ChevronDown size={14} className="text-[--color-text-muted]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[--color-surface] border border-[--color-border] rounded-none z-50">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[--color-text] hover:bg-[--color-background] transition-colors"
          >
            <User size={14} />
            {t('nav.profile', 'Profile')}
          </Link>
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[--color-danger] hover:bg-[--color-background] transition-colors w-full text-left"
          >
            <LogOut size={14} />
            {t('nav.logout', 'Log Out')}
          </button>
        </div>
      )}
    </div>
  );
}
