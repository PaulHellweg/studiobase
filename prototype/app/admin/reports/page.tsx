"use client";

import { TopNav } from "@/components/TopNav";
import { KPICard } from "@/components/KPICard";

export default function ReportsPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Revenue Reports</h1>

        {/* Date Range Selector */}
        <div className="bg-white border border-[var(--color-border)] p-6 mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-600 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-600 mb-2">End Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <button className="px-6 py-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
              Generate Report
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard label="Total Revenue" value="€2,840" />
          <KPICard label="Credit Pack Sales" value="€1,680" />
          <KPICard label="Subscription Revenue" value="€1,160" />
        </div>

        {/* Breakdown Table */}
        <div className="bg-white border border-[var(--color-border)]">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-heading font-600 text-xl">Revenue Breakdown</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="px-6 py-3 text-left text-sm font-600">Source</th>
                <th className="px-6 py-3 text-right text-sm font-600">Amount</th>
                <th className="px-6 py-3 text-right text-sm font-600">Transactions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-6 py-4">5-Class Pack</td>
                <td className="px-6 py-4 text-right font-mono">€750</td>
                <td className="px-6 py-4 text-right">10</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-6 py-4">10-Class Pack</td>
                <td className="px-6 py-4 text-right font-mono">€930</td>
                <td className="px-6 py-4 text-right">7</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-6 py-4">Weekly Unlimited</td>
                <td className="px-6 py-4 text-right font-mono">€490</td>
                <td className="px-6 py-4 text-right">10</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Monthly 8-Class</td>
                <td className="px-6 py-4 text-right font-mono">€670</td>
                <td className="px-6 py-4 text-right">7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
