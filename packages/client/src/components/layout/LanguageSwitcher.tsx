import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div className="flex border border-[--color-border] rounded-none">
      {(['en', 'de'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={cn(
            'px-2 py-1 text-xs font-semibold uppercase transition-colors duration-250',
            current === lang
              ? 'bg-[--color-primary] text-white'
              : 'text-[--color-text-muted] hover:text-[--color-text]',
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
