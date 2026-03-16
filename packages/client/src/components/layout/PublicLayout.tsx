import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/Button';

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[--color-background]">
      <header className="border-b border-[--color-border] bg-[--color-surface]">
        <nav className="max-w-[72rem] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg font-semibold text-[--color-text]">
            {t('app.name', 'StudioBase')}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/auth/login">
              <Button variant="secondary" size="sm">
                {t('nav.login', 'Log In')}
              </Button>
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <div className="max-w-[72rem] mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-[--color-border] bg-[--color-surface]">
        <div className="max-w-[72rem] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[--color-text-muted]">
          <span>&copy; {new Date().getFullYear()} StudioBase</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[--color-text] transition-colors">Impressum</a>
            <a href="#" className="hover:text-[--color-text] transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
