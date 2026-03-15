import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./trpc";
import { appRouter } from "./routers";
import { constructWebhookEvent } from "./lib/stripe";
import { prisma } from "./db";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ─── Stripe webhook — raw body MUST come before express.json() ────────────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).json({ error: "Missing Stripe signature or webhook secret" });
      return;
    }

    try {
      const event = constructWebhookEvent(req.body, sig as string, webhookSecret);

      // Process event via the payment router logic directly
      const caller = appRouter.createCaller({
        userId: undefined,
        tenantId: undefined,
        roles: [],
        prisma,
      });
      await caller.payment.webhook({ event: event as unknown as Record<string, unknown> });

      res.json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: `Webhook error: ${message}` });
    }
  }
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

// ─── tRPC ─────────────────────────────────────────────────────────────────────
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC] Error on ${path ?? "unknown"}:`, error);
      }
    },
  })
);

app.listen(PORT, () => {
  console.log(`[studiobase] Server running on http://localhost:${PORT}`);
  console.log(`[studiobase] tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`[studiobase] Health: http://localhost:${PORT}/api/health`);
});
