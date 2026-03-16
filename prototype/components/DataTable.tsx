"use client";

import { ReactNode, useState } from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border border-[var(--color-border)]">
      {/* Search Bar */}
      <div className="border-b border-[var(--color-border)] p-4">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-600 text-[var(--color-text)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-250"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-sm">
                    {col.render ? col.render(item) : item[col.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-[var(--color-border)] p-4 flex justify-between items-center">
          <div className="text-sm text-[var(--color-text-muted)]">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-[var(--color-border)] disabled:opacity-50 hover:bg-[var(--color-surface)] transition-colors duration-250"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-[var(--color-border)] disabled:opacity-50 hover:bg-[var(--color-surface)] transition-colors duration-250"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
