import { TopNav } from "@/components/TopNav";
import { mockTenant, mockClassTypes, mockScheduleEntries } from "@/lib/mock-data";
import Link from "next/link";

export default function StudioLandingPage() {
  const upcomingClasses = mockScheduleEntries
    .filter(e => e.status === 'published')
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-12 fade-in-up">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="font-heading font-700 text-5xl mb-4 text-[var(--color-primary)]">
            {mockTenant.name}
          </h1>
          <p className="text-xl text-[var(--color-text-muted)] mb-2">
            {mockTenant.description}
          </p>
          <p className="text-[var(--color-text-muted)]">{mockTenant.location}</p>
        </div>

        {/* Class Highlights */}
        <div className="mb-12">
          <h2 className="font-heading font-600 text-2xl mb-6">Our Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockClassTypes.map((classType) => (
              <div
                key={classType.id}
                className="bg-white border border-[var(--color-border)] p-6"
              >
                <h3 className="font-heading font-600 text-xl mb-2">
                  {classType.name}
                </h3>
                <p className="text-[var(--color-text-muted)] mb-4">
                  {classType.description}
                </p>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {classType.durationMinutes} minutes · Up to {classType.capacity} students
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/zen-flow/schedule"
            className="inline-block px-8 py-4 bg-[var(--color-primary)] text-white text-lg hover:bg-[var(--color-primary-light)] transition-colors duration-250"
          >
            View Schedule & Book Classes
          </Link>
        </div>
      </main>
    </div>
  );
}
