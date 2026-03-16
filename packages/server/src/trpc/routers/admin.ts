import { router, adminProcedure } from '../trpc.js';
import { decryptPII, decryptPIIList } from '../../middleware/encryption.js';
import {
  bookings,
  tenantMemberships,
  payments,
  subscriptions,
  teachers,
  users,
} from '@studiobase/shared/schema';
import {
  paginationInput,
  dateRangeInput,
  idInput,
} from '@studiobase/shared/validation';
import { eq, and, count, sum, sql } from 'drizzle-orm';
import { getBalance } from '../../services/credit-service.js';
import { getUserBookings } from '../../services/booking-service.js';

export const adminRouter = router({
  dashboard: adminProcedure.query(async ({ ctx }) => {
    const [bookingCount] = await ctx.db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, ctx.tenantId),
          eq(bookings.status, 'confirmed'),
        ),
      );

    const [customerCount] = await ctx.db
      .select({ count: count() })
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, ctx.tenantId),
          eq(tenantMemberships.role, 'customer'),
        ),
      );

    const [revenueResult] = await ctx.db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, ctx.tenantId),
          eq(payments.status, 'completed'),
        ),
      );

    const [subscriptionCount] = await ctx.db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.tenantId, ctx.tenantId),
          eq(subscriptions.status, 'active'),
        ),
      );

    return {
      totalBookings: bookingCount?.count ?? 0,
      totalCustomers: customerCount?.count ?? 0,
      totalRevenue: Number(revenueResult?.total ?? 0),
      activeSubscriptions: subscriptionCount?.count ?? 0,
    };
  }),

  revenueReport: adminProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(payments.tenantId, ctx.tenantId),
        eq(payments.status, 'completed'),
      ];

      if (input.dateFrom) {
        conditions.push(
          sql`${payments.createdAt} >= ${new Date(input.dateFrom)}` as any,
        );
      }
      if (input.dateTo) {
        conditions.push(
          sql`${payments.createdAt} <= ${new Date(input.dateTo)}` as any,
        );
      }

      return ctx.db
        .select({
          month: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`,
          type: payments.type,
          total: sum(payments.amount),
          count: count(),
        })
        .from(payments)
        .where(and(...conditions))
        .groupBy(
          sql`to_char(${payments.createdAt}, 'YYYY-MM')`,
          payments.type,
        )
        .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`);
    }),

  listTeachers: adminProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: teachers.id,
          userId: teachers.userId,
          bio: teachers.bio,
          avatarUrl: teachers.avatarUrl,
          active: teachers.active,
          createdAt: teachers.createdAt,
          name: users.name,
          email: users.email,
        })
        .from(teachers)
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(eq(teachers.tenantId, ctx.tenantId))
        .limit(input.limit)
        .offset(input.offset);
      return decryptPIIList(rows);
    }),

  listCustomers: adminProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          membershipId: tenantMemberships.id,
          userId: tenantMemberships.userId,
          role: tenantMemberships.role,
          joinedAt: tenantMemberships.createdAt,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(tenantMemberships)
        .innerJoin(users, eq(tenantMemberships.userId, users.id))
        .where(
          and(
            eq(tenantMemberships.tenantId, ctx.tenantId),
            eq(tenantMemberships.role, 'customer'),
          ),
        )
        .limit(input.limit)
        .offset(input.offset);
      return decryptPIIList(rows);
    }),

  customerDetail: adminProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => {
      const [membership] = await ctx.db
        .select({
          membershipId: tenantMemberships.id,
          userId: tenantMemberships.userId,
          role: tenantMemberships.role,
          joinedAt: tenantMemberships.createdAt,
          name: users.name,
          email: users.email,
          image: users.image,
          phone: users.phone,
          locale: users.locale,
        })
        .from(tenantMemberships)
        .innerJoin(users, eq(tenantMemberships.userId, users.id))
        .where(
          and(
            eq(tenantMemberships.tenantId, ctx.tenantId),
            eq(tenantMemberships.userId, input.id),
          ),
        )
        .limit(1);

      if (!membership) {
        return null;
      }

      const [userBookings, creditBalance] = await Promise.all([
        getUserBookings(input.id, ctx.tenantId, 50, 0, ctx.db),
        getBalance(input.id, ctx.tenantId, ctx.db),
      ]);

      return {
        ...decryptPII(membership),
        bookings: decryptPIIList(userBookings),
        creditBalance,
      };
    }),
});
