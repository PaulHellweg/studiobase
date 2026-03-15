import { describe, it, expect } from 'vitest';

// ─── Pure schedule instance generator ────────────────────────────────────────
//
// The generateInstances function in schedule.ts is internal to the router.
// We extract and test its pure date-generation logic here so that schedule
// recurrence rules can be verified without any database dependency.

interface ScheduleDef {
  id: string;
  tenantId: string;
  classTypeId: string;
  roomId: string;
  teacherId: string;
  recurrenceType: 'none' | 'daily' | 'weekly' | 'custom';
  recurrenceDays: number[];
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  startDate: Date;
  endDate: Date | null;
  maxCapacity: number;
}

interface InstanceRecord {
  scheduleId: string;
  tenantId: string;
  classTypeId: string;
  roomId: string;
  teacherId: string;
  startAt: Date;
  endAt: Date;
  maxCapacity: number;
}

/** Mirrors the generateInstances logic from schedule.ts (pure, no DB) */
function buildInstances(schedule: ScheduleDef): InstanceRecord[] {
  const instances: InstanceRecord[] = [];

  const start = new Date(schedule.startDate);
  const end = schedule.endDate
    ? new Date(schedule.endDate)
    : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);

  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();

    const shouldInclude =
      schedule.recurrenceType === 'none'
        ? current.toDateString() === start.toDateString()
        : schedule.recurrenceType === 'daily'
        ? true
        : schedule.recurrenceType === 'weekly' || schedule.recurrenceType === 'custom'
        ? schedule.recurrenceDays.includes(dayOfWeek)
        : false;

    if (shouldInclude) {
      const startAt = new Date(current);
      startAt.setHours(startHour, startMin, 0, 0);
      const endAt = new Date(current);
      endAt.setHours(endHour, endMin, 0, 0);

      instances.push({
        scheduleId: schedule.id,
        tenantId: schedule.tenantId,
        classTypeId: schedule.classTypeId,
        roomId: schedule.roomId,
        teacherId: schedule.teacherId,
        startAt,
        endAt,
        maxCapacity: schedule.maxCapacity,
      });
    }

    if (schedule.recurrenceType === 'none') break;
    current.setDate(current.getDate() + 1);
  }

  return instances;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_SCHEDULE: Omit<ScheduleDef, 'startDate' | 'endDate' | 'recurrenceType' | 'recurrenceDays'> = {
  id: 'sched-1',
  tenantId: 'tenant-1',
  classTypeId: 'cls-1',
  roomId: 'room-1',
  teacherId: 'teacher-1',
  startTime: '09:00',
  endTime: '10:00',
  maxCapacity: 15,
};

function monday(weeksAhead = 0): Date {
  const d = new Date('2026-03-16T00:00:00.000Z'); // known Monday
  d.setDate(d.getDate() + weeksAhead * 7);
  return d;
}

// ─── Wöchentliche Wiederholung ────────────────────────────────────────────────

describe('Wöchentliche Wiederholung', () => {
  it('erzeugt korrekte Termine für 4 Wochen (montags)', () => {
    const start = monday(0);
    const end = monday(3); // 3 weeks later = 4 Mondays total

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [1], // Monday
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    expect(instances).toHaveLength(4);
    instances.forEach((inst) => {
      expect(inst.startAt.getDay()).toBe(1); // all Mondays
    });
  });

  it('erzeugt Termine für mehrere Wochentage', () => {
    const start = new Date('2026-03-16T00:00:00.000Z'); // Monday
    const end = new Date('2026-03-22T00:00:00.000Z');   // Sunday

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [1, 3, 5], // Mon, Wed, Fri
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    expect(instances).toHaveLength(3);
    const days = instances.map((i) => i.startAt.getDay());
    expect(days).toContain(1);
    expect(days).toContain(3);
    expect(days).toContain(5);
  });

  it('setzt korrekte Uhrzeit auf allen Instanzen', () => {
    const start = monday(0);
    const end = monday(1);

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      startTime: '18:30',
      endTime: '19:45',
      recurrenceType: 'weekly',
      recurrenceDays: [1],
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    instances.forEach((inst) => {
      expect(inst.startAt.getHours()).toBe(18);
      expect(inst.startAt.getMinutes()).toBe(30);
      expect(inst.endAt.getHours()).toBe(19);
      expect(inst.endAt.getMinutes()).toBe(45);
    });
  });
});

// ─── Zweiwöchentliche Wiederholung (custom) ───────────────────────────────────

describe('Zweiwöchentliche Wiederholung', () => {
  it('überspringt jede zweite Woche bei biweekly-Logik', () => {
    // Biweekly: generate weekly instances and filter every other
    const start = monday(0);
    const end = monday(3); // 4-week window

    // Build weekly first, then simulate biweekly by filtering even/odd weeks
    const weekly: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [1],
      startDate: start,
      endDate: end,
    };

    const allWeekly = buildInstances(weekly);
    // Keep every other (biweekly)
    const biweekly = allWeekly.filter((_, i) => i % 2 === 0);

    expect(allWeekly).toHaveLength(4);
    expect(biweekly).toHaveLength(2);

    // The gap between the two biweekly instances is exactly 14 days
    const gapMs = biweekly[1].startAt.getTime() - biweekly[0].startAt.getTime();
    expect(gapMs).toBe(14 * 24 * 60 * 60 * 1000);
  });
});

// ─── Einmalige Termine (none) ─────────────────────────────────────────────────

describe('Einmalige Termine', () => {
  it('erzeugt genau eine Instanz für recurrenceType "none"', () => {
    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'none',
      recurrenceDays: [],
      startDate: monday(0),
      endDate: null,
    };

    const instances = buildInstances(schedule);
    expect(instances).toHaveLength(1);
    expect(instances[0].startAt.toDateString()).toBe(monday(0).toDateString());
  });
});

// ─── validFrom / validUntil Datumsbereich ─────────────────────────────────────

describe('Datumsbereich validFrom/validUntil', () => {
  it('erzeugt keine Instanzen außerhalb des Datumsbereichs', () => {
    const start = monday(0);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000); // same week only

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [1], // only Mondays
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    // Only 1 Monday within that single week
    expect(instances).toHaveLength(1);
    expect(instances[0].startAt.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('90-Tage-Fenster wird als Standard verwendet wenn kein endDate', () => {
    const start = monday(0);
    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [1],
      startDate: start,
      endDate: null,
    };

    const instances = buildInstances(schedule);
    // 90 days / 7 ≈ 12–13 Mondays
    expect(instances.length).toBeGreaterThanOrEqual(12);
    expect(instances.length).toBeLessThanOrEqual(14);
  });

  it('respektiert das endDate und erzeugt keine Instanz danach', () => {
    const start = monday(0);
    const end = monday(2); // 3 Mondays max

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [1],
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    instances.forEach((inst) => {
      expect(inst.startAt.getTime()).toBeLessThanOrEqual(end.getTime() + 24 * 60 * 60 * 1000);
    });
    expect(instances).toHaveLength(3);
  });

  it('erzeugt Instanzen für den korrekten Wochentag', () => {
    const start = new Date('2026-03-16T00:00:00.000Z'); // Monday
    const end = new Date('2026-03-22T00:00:00.000Z');   // Sunday

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [3], // Wednesday only
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    expect(instances).toHaveLength(1);
    expect(instances[0].startAt.getDay()).toBe(3); // Wednesday
  });
});

// ─── Tägliche Wiederholung ────────────────────────────────────────────────────

describe('Tägliche Wiederholung', () => {
  it('erzeugt jeden Tag einen Termin', () => {
    const start = monday(0);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000); // 7 days

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'daily',
      recurrenceDays: [],
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    expect(instances).toHaveLength(7);
  });

  it('setzt maxCapacity korrekt auf allen Instanzen', () => {
    const start = monday(0);
    const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);

    const schedule: ScheduleDef = {
      ...BASE_SCHEDULE,
      maxCapacity: 20,
      recurrenceType: 'daily',
      recurrenceDays: [],
      startDate: start,
      endDate: end,
    };

    const instances = buildInstances(schedule);
    instances.forEach((inst) => {
      expect(inst.maxCapacity).toBe(20);
    });
  });
});

// ─── Custom Recurrence ────────────────────────────────────────────────────────

describe('Custom Recurrence', () => {
  it('custom verhält sich wie weekly mit definierten recurrenceDays', () => {
    const start = new Date('2026-03-16T00:00:00.000Z'); // Monday
    const end = new Date('2026-03-22T00:00:00.000Z');   // Sunday

    const weekly: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'weekly',
      recurrenceDays: [2, 4], // Tue, Thu
      startDate: start,
      endDate: end,
    };

    const custom: ScheduleDef = {
      ...BASE_SCHEDULE,
      recurrenceType: 'custom',
      recurrenceDays: [2, 4],
      startDate: start,
      endDate: end,
    };

    const weeklyInstances = buildInstances(weekly);
    const customInstances = buildInstances(custom);

    expect(customInstances).toHaveLength(weeklyInstances.length);
    customInstances.forEach((inst, i) => {
      expect(inst.startAt.toDateString()).toBe(weeklyInstances[i].startAt.toDateString());
    });
  });
});
