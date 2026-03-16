import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { useTranslation } from 'react-i18next';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder,
  searchFn,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search || !searchFn) return data;
    return data.filter((row) => searchFn(row, search));
  }, [data, search, searchFn]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortFn) return filtered;
    const mult = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => col.sortFn!(a, b) * mult);
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t('common.noData', 'No data')}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div>
      {searchFn && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder ?? t('common.search', 'Search...')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[--color-border] rounded-none bg-white text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[--color-border]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left px-3 py-2.5 font-semibold text-[--color-text-muted] whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-[--color-text]',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-[--color-border]/50 hover:bg-[--color-surface] transition-colors duration-250"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[--color-text-muted]">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} / {sorted.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('common.back', 'Back')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next', 'Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
