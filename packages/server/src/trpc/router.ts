import { router } from './trpc.js';
import { tenantRouter } from './routers/tenant.js';
import { studioRouter } from './routers/studio.js';
import { classTypeRouter } from './routers/class-type.js';
import { scheduleRouter } from './routers/schedule.js';
import { bookingRouter } from './routers/booking.js';
import { creditRouter } from './routers/credit.js';
import { paymentRouter } from './routers/payment.js';
import { userRouter } from './routers/user.js';
import { waitlistRouter } from './routers/waitlist.js';
import { creditPackRouter } from './routers/credit-pack.js';
import { subscriptionTierRouter } from './routers/subscription-tier.js';
import { adminRouter } from './routers/admin.js';

export const appRouter = router({
  tenant: tenantRouter,
  studio: studioRouter,
  classType: classTypeRouter,
  schedule: scheduleRouter,
  booking: bookingRouter,
  credit: creditRouter,
  payment: paymentRouter,
  user: userRouter,
  waitlist: waitlistRouter,
  creditPack: creditPackRouter,
  subscriptionTier: subscriptionTierRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
