"use client";

import { TopNav } from "@/components/TopNav";
import { KPICard } from "@/components/KPICard";
import { mockScheduleEntries, getClassType, getTeacher } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  const todayClasses = mockScheduleEntries.filter(e =>
    e.startTime.startsWith(today) && e.status === 'published'
  );

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Dashboard</h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <KPICard label="Bookings Today" value={todayClasses.reduce((sum, e) => sum + e.bookedCount, 0)} />
          <KPICard label="Revenue This Month" value="€2,840" change="+12% vs last month" />
          <KPICard label="Attendance Rate" value="94%" change="+3% vs last month" />
          <KPICard label="Active Customers" value="127" change="+8 this week" />
        </div>

        {/* Today's Schedule */}
        <div className="mb-12">
          <h2 className="font-heading font-600 text-2xl mb-4">Today's Schedule</h2>
          <div className="bg-white border border-[var(--color-border)]">
            <div className="divide-y divide-[var(--color-border)]">
              {todayClasses.length > 0 ? (
                todayClasses.map((entry) => {
                  const classType = getClassType(entry.classTypeId);
                  const teacher = getTeacher(entry.teacherId);
                  const startTime = new Date(entry.startTime);
                  return (
                    <div key={entry.id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-heading font-600 text-lg">{classType?.name}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">
                          {teacher?.name} · {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--color-text-muted)]">Booked</div>
                        <div className="font-heading font-700 text-xl">{entry.bookedCount}/{entry.capacity}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                  No classes scheduled for today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="font-heading font-600 text-2xl mb-4">Recent Activity</h2>
          <div className="bg-white border border-[var(--color-border)]">
            <div className="divide-y divide-[var(--color-border)]">
              <div className="px-6 py-4">
                <div className="text-sm text-[var(--color-text-muted)] mb-1">2 hours ago</div>
                <div>Anna Becker booked Vinyasa Flow</div>
              </div>
              <div className="px-6 py-4">
                <div className="text-sm text-[var(--color-text-muted)] mb-1">3 hours ago</div>
                <div>Thomas Klein cancelled Yin Yoga</div>
              </div>
              <div className="px-6 py-4">
                <div className="text-sm text-[var(--color-text-muted)] mb-1">5 hours ago</div>
                <div>New customer: Sarah Johnson</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
