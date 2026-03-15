import { router } from "../trpc";
import { tenantRouter } from "./tenant";
import { studioRouter } from "./studio";
import { classTypeRouter } from "./classType";
import { scheduleRouter } from "./schedule";
import { bookingRouter } from "./booking";
import { creditRouter } from "./credit";
import { paymentRouter } from "./payment";
import { userRouter } from "./user";

export const appRouter = router({
  tenant: tenantRouter,
  studio: studioRouter,
  classType: classTypeRouter,
  schedule: scheduleRouter,
  booking: bookingRouter,
  credit: creditRouter,
  payment: paymentRouter,
  users: userRouter,
});

export type AppRouter = typeof appRouter;
