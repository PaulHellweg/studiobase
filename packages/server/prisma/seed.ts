import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Tenant ───────────────────────────────────────────────────────────────

  const tenant = await prisma.tenant.upsert({
    where: { slug: "halenow" },
    update: {},
    create: {
      name: "Hale Now",
      slug: "halenow",
      primaryColor: "#8b5cf6",
      isActive: true,
    },
  });
  console.log(`✓ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Studios & Rooms ──────────────────────────────────────────────────────

  const studio1 = await prisma.studio.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      tenantId: tenant.id,
      name: "Hale Now Mitte",
      address: "Torstraße 12, 10119 Berlin",
      timezone: "Europe/Berlin",
      isActive: true,
    },
  });

  const studio2 = await prisma.studio.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      tenantId: tenant.id,
      name: "Hale Now Prenzlauer Berg",
      address: "Kastanienallee 77, 10435 Berlin",
      timezone: "Europe/Berlin",
      isActive: true,
    },
  });

  console.log(`✓ Studios: ${studio1.name}, ${studio2.name}`);

  // Rooms for Studio 1
  const room1a = await prisma.room.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      studioId: studio1.id,
      tenantId: tenant.id,
      name: "Großer Saal",
      capacity: 20,
      isActive: true,
    },
  });

  const room1b = await prisma.room.upsert({
    where: { id: "00000000-0000-0000-0000-000000000102" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000102",
      studioId: studio1.id,
      tenantId: tenant.id,
      name: "Reformer Studio",
      capacity: 8,
      isActive: true,
    },
  });

  // Rooms for Studio 2
  const room2a = await prisma.room.upsert({
    where: { id: "00000000-0000-0000-0000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000201",
      studioId: studio2.id,
      tenantId: tenant.id,
      name: "Hauptraum",
      capacity: 15,
      isActive: true,
    },
  });

  const room2b = await prisma.room.upsert({
    where: { id: "00000000-0000-0000-0000-000000000202" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000202",
      studioId: studio2.id,
      tenantId: tenant.id,
      name: "Aerial Raum",
      capacity: 6,
      isActive: true,
    },
  });

  console.log(`✓ Rooms: ${room1a.name}, ${room1b.name}, ${room2a.name}, ${room2b.name}`);

  // ─── Class Types ──────────────────────────────────────────────────────────

  const classTypes = await Promise.all([
    prisma.classType.upsert({
      where: { id: "00000000-0000-0000-0000-000000001001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000001001",
        tenantId: tenant.id,
        name: "Yoga Flow",
        description: "Dynamische Verbindung von Atemübungen und Asanas",
        category: "yoga",
        durationMinutes: 60,
        creditCost: 2,
        color: "#a78bfa",
        isActive: true,
      },
    }),
    prisma.classType.upsert({
      where: { id: "00000000-0000-0000-0000-000000001002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000001002",
        tenantId: tenant.id,
        name: "Pilates Mat",
        description: "Bodenbasiertes Pilates für Körpermitte und Stabilität",
        category: "pilates",
        durationMinutes: 50,
        creditCost: 2,
        color: "#34d399",
        isActive: true,
      },
    }),
    prisma.classType.upsert({
      where: { id: "00000000-0000-0000-0000-000000001003" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000001003",
        tenantId: tenant.id,
        name: "Reformer Pilates",
        description: "Gerätebasiertes Pilates auf dem Reformer",
        category: "pilates",
        durationMinutes: 55,
        creditCost: 3,
        color: "#fb923c",
        isActive: true,
      },
    }),
    prisma.classType.upsert({
      where: { id: "00000000-0000-0000-0000-000000001004" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000001004",
        tenantId: tenant.id,
        name: "Barre",
        description: "Ballett-inspiriertes Training für Kraft und Ausdauer",
        category: "fitness",
        durationMinutes: 45,
        creditCost: 2,
        color: "#f472b6",
        isActive: true,
      },
    }),
    prisma.classType.upsert({
      where: { id: "00000000-0000-0000-0000-000000001005" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000001005",
        tenantId: tenant.id,
        name: "Sound Healing",
        description: "Klangschalenmeditation für tiefe Entspannung",
        category: "meditation",
        durationMinutes: 75,
        creditCost: 2,
        color: "#60a5fa",
        isActive: true,
      },
    }),
    prisma.classType.upsert({
      where: { id: "00000000-0000-0000-0000-000000001006" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000001006",
        tenantId: tenant.id,
        name: "Aerial Yoga",
        description: "Yoga in der Hängematte — für Fortgeschrittene",
        category: "yoga",
        durationMinutes: 60,
        creditCost: 3,
        color: "#f59e0b",
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Class types: ${classTypes.map((ct) => ct.name).join(", ")}`);

  // ─── Credit Packages ──────────────────────────────────────────────────────

  const packages = await Promise.all([
    prisma.creditPackage.upsert({
      where: { id: "00000000-0000-0000-0000-000000002001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000002001",
        tenantId: tenant.id,
        name: "10er Karte",
        credits: 20,
        priceCents: 14900,
        currency: "EUR",
        validityDays: 180,
        isActive: true,
      },
    }),
    prisma.creditPackage.upsert({
      where: { id: "00000000-0000-0000-0000-000000002002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000002002",
        tenantId: tenant.id,
        name: "20er Karte",
        credits: 40,
        priceCents: 26900,
        currency: "EUR",
        validityDays: 365,
        isActive: true,
      },
    }),
    prisma.creditPackage.upsert({
      where: { id: "00000000-0000-0000-0000-000000002003" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000002003",
        tenantId: tenant.id,
        name: "Unlimited Monthly",
        credits: 999,
        priceCents: 9900,
        currency: "EUR",
        validityDays: 30,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Credit packages: ${packages.map((p) => p.name).join(", ")}`);

  // ─── Test Users ───────────────────────────────────────────────────────────

  // Teacher user
  const teacherProfile = await prisma.userProfile.upsert({
    where: { keycloakId: "test-teacher-keycloak-id" },
    update: {},
    create: {
      keycloakId: "test-teacher-keycloak-id",
      tenantId: tenant.id,
      email: "teacher@halenow.de",
      firstName: "Sarah",
      lastName: "Müller",
      phone: "+49 30 12345678",
      marketingConsent: true,
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userProfileId: teacherProfile.id },
    update: {},
    create: {
      userProfileId: teacherProfile.id,
      tenantId: tenant.id,
      bio: "Zertifizierte Yoga- und Pilates-Lehrerin mit 10 Jahren Erfahrung",
      specialties: ["Yoga Flow", "Pilates Mat", "Yin Yoga"],
      isActive: true,
    },
  });

  // Admin user
  const adminProfile = await prisma.userProfile.upsert({
    where: { keycloakId: "test-admin-keycloak-id" },
    update: {},
    create: {
      keycloakId: "test-admin-keycloak-id",
      tenantId: tenant.id,
      email: "admin@halenow.de",
      firstName: "Max",
      lastName: "Admin",
      marketingConsent: false,
    },
  });

  // Customer users
  const customer1 = await prisma.userProfile.upsert({
    where: { keycloakId: "test-customer1-keycloak-id" },
    update: {},
    create: {
      keycloakId: "test-customer1-keycloak-id",
      tenantId: tenant.id,
      email: "anna.schmidt@example.com",
      firstName: "Anna",
      lastName: "Schmidt",
      phone: "+49 171 9876543",
      marketingConsent: true,
    },
  });

  const customer2 = await prisma.userProfile.upsert({
    where: { keycloakId: "test-customer2-keycloak-id" },
    update: {},
    create: {
      keycloakId: "test-customer2-keycloak-id",
      tenantId: tenant.id,
      email: "lisa.bauer@example.com",
      firstName: "Lisa",
      lastName: "Bauer",
      phone: "+49 172 5551234",
      marketingConsent: false,
    },
  });

  const customer3 = await prisma.userProfile.upsert({
    where: { keycloakId: "test-customer3-keycloak-id" },
    update: {},
    create: {
      keycloakId: "test-customer3-keycloak-id",
      tenantId: tenant.id,
      email: "tom.klein@example.com",
      firstName: "Tom",
      lastName: "Klein",
      marketingConsent: true,
    },
  });

  console.log(
    `✓ Users: ${teacherProfile.email}, ${adminProfile.email}, ${customer1.email}, ${customer2.email}, ${customer3.email}`
  );

  // Credit balances for customers
  await prisma.creditBalance.upsert({
    where: { userId: customer1.id },
    update: {},
    create: { userId: customer1.id, tenantId: tenant.id, balance: 14 },
  });

  await prisma.creditBalance.upsert({
    where: { userId: customer2.id },
    update: {},
    create: { userId: customer2.id, tenantId: tenant.id, balance: 40 },
  });

  await prisma.creditBalance.upsert({
    where: { userId: customer3.id },
    update: {},
    create: { userId: customer3.id, tenantId: tenant.id, balance: 4 },
  });

  console.log("✓ Credit balances created");

  // ─── Schedules ────────────────────────────────────────────────────────────

  // Get the week start (Monday of the current week)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Yoga Flow — Mon, Wed, Fri mornings
  const schedule1 = await prisma.schedule.upsert({
    where: { id: "00000000-0000-0000-0000-000000003001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000003001",
      tenantId: tenant.id,
      classTypeId: classTypes[0].id, // Yoga Flow
      roomId: room1a.id,
      teacherId: teacherProfile.id,
      recurrenceType: "weekly",
      recurrenceDays: [1, 3, 5], // Mon, Wed, Fri
      startTime: "08:00",
      endTime: "09:00",
      startDate: monday,
      endDate: sunday,
      maxCapacity: 15,
      isActive: true,
    },
  });

  // Pilates Mat — Tue, Thu mornings
  const schedule2 = await prisma.schedule.upsert({
    where: { id: "00000000-0000-0000-0000-000000003002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000003002",
      tenantId: tenant.id,
      classTypeId: classTypes[1].id, // Pilates Mat
      roomId: room1a.id,
      teacherId: teacherProfile.id,
      recurrenceType: "weekly",
      recurrenceDays: [2, 4], // Tue, Thu
      startTime: "09:30",
      endTime: "10:20",
      startDate: monday,
      endDate: sunday,
      maxCapacity: 12,
      isActive: true,
    },
  });

  // Reformer Pilates — Mon, Wed small group
  const schedule3 = await prisma.schedule.upsert({
    where: { id: "00000000-0000-0000-0000-000000003003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000003003",
      tenantId: tenant.id,
      classTypeId: classTypes[2].id, // Reformer Pilates
      roomId: room1b.id,
      teacherId: teacherProfile.id,
      recurrenceType: "weekly",
      recurrenceDays: [1, 3], // Mon, Wed
      startTime: "11:00",
      endTime: "11:55",
      startDate: monday,
      endDate: sunday,
      maxCapacity: 8,
      isActive: true,
    },
  });

  // Barre — Tue, Thu afternoons
  const schedule4 = await prisma.schedule.upsert({
    where: { id: "00000000-0000-0000-0000-000000003004" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000003004",
      tenantId: tenant.id,
      classTypeId: classTypes[3].id, // Barre
      roomId: room2a.id,
      teacherId: teacherProfile.id,
      recurrenceType: "weekly",
      recurrenceDays: [2, 4], // Tue, Thu
      startTime: "18:00",
      endTime: "18:45",
      startDate: monday,
      endDate: sunday,
      maxCapacity: 12,
      isActive: true,
    },
  });

  // Sound Healing — Saturday evening
  const schedule5 = await prisma.schedule.upsert({
    where: { id: "00000000-0000-0000-0000-000000003005" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000003005",
      tenantId: tenant.id,
      classTypeId: classTypes[4].id, // Sound Healing
      roomId: room2a.id,
      teacherId: teacherProfile.id,
      recurrenceType: "weekly",
      recurrenceDays: [6], // Sat
      startTime: "17:00",
      endTime: "18:15",
      startDate: monday,
      endDate: sunday,
      maxCapacity: 10,
      isActive: true,
    },
  });

  // Aerial Yoga — Fri evenings
  const schedule6 = await prisma.schedule.upsert({
    where: { id: "00000000-0000-0000-0000-000000003006" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000003006",
      tenantId: tenant.id,
      classTypeId: classTypes[5].id, // Aerial Yoga
      roomId: room2b.id,
      teacherId: teacherProfile.id,
      recurrenceType: "weekly",
      recurrenceDays: [5], // Fri
      startTime: "19:00",
      endTime: "20:00",
      startDate: monday,
      endDate: sunday,
      maxCapacity: 6,
      isActive: true,
    },
  });

  console.log(
    `✓ Schedules: ${[schedule1, schedule2, schedule3, schedule4, schedule5, schedule6].length} created`
  );

  // ─── Schedule Instances (generate for the week) ───────────────────────────

  type InstanceData = {
    scheduleId: string;
    tenantId: string;
    classTypeId: string;
    roomId: string;
    teacherId: string;
    startAt: Date;
    endAt: Date;
    maxCapacity: number;
    status: "scheduled";
  };

  function generateWeekInstances(
    schedule: {
      id: string;
      tenantId: string;
      classTypeId: string;
      roomId: string;
      teacherId: string;
      recurrenceDays: number[];
      startTime: string;
      endTime: string;
      maxCapacity: number;
    },
    weekStart: Date,
    weekEnd: Date
  ): InstanceData[] {
    const instances: InstanceData[] = [];
    const [startHour, startMin] = schedule.startTime.split(":").map(Number);
    const [endHour, endMin] = schedule.endTime.split(":").map(Number);

    const current = new Date(weekStart);
    while (current <= weekEnd) {
      const dow = current.getDay();
      if (schedule.recurrenceDays.includes(dow)) {
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
          status: "scheduled",
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return instances;
  }

  // Delete existing instances for these schedules to avoid conflicts on re-seed
  await prisma.scheduleInstance.deleteMany({
    where: {
      scheduleId: {
        in: [
          schedule1.id,
          schedule2.id,
          schedule3.id,
          schedule4.id,
          schedule5.id,
          schedule6.id,
        ],
      },
    },
  });

  const allInstances = [
    ...generateWeekInstances(schedule1, monday, sunday),
    ...generateWeekInstances(schedule2, monday, sunday),
    ...generateWeekInstances(schedule3, monday, sunday),
    ...generateWeekInstances(schedule4, monday, sunday),
    ...generateWeekInstances(schedule5, monday, sunday),
    ...generateWeekInstances(schedule6, monday, sunday),
  ];

  await prisma.scheduleInstance.createMany({
    data: allInstances,
    skipDuplicates: true,
  });

  console.log(`✓ Schedule instances: ${allInstances.length} created for the current week`);

  console.log("\n✅ Seeding complete!");
  console.log(`   Tenant ID: ${tenant.id}`);
  console.log(`   Teacher:   ${teacherProfile.email}`);
  console.log(`   Admin:     ${adminProfile.email}`);
  console.log(`   Customers: ${customer1.email}, ${customer2.email}, ${customer3.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
