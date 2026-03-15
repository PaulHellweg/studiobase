import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./trpc";
import { appRouter } from "./routers";
import { constructWebhookEvent } from "./lib/stripe";
import { prisma } from "./db";
import { apiLimiter, webhookLimiter } from "./middleware/rateLimiter";
import { securityHeaders } from "./middleware/securityHeaders";
import { logger } from "./lib/logger";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";
const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8080";

// ─── Security headers (helmet + custom) ───────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com", KEYCLOAK_URL],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    // HSTS is also set by securityHeaders middleware with custom params
    strictTransportSecurity: false,
  })
);
app.use(securityHeaders);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ─── Request logging middleware ────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "incoming request");
  next();
});

// ─── Global rate limiting ──────────────────────────────────────────────────────
app.use(apiLimiter);

// ─── Stripe webhook — raw body MUST come before express.json() ────────────────
app.post(
  "/api/stripe/webhook",
  webhookLimiter,
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
        logger.error({ path: path ?? "unknown", err: error }, "[tRPC] Internal server error");
      }
    },
  })
);

app.listen(PORT, () => {
  logger.info({ port: PORT, url: `http://localhost:${PORT}` }, "[studiobase] Server running");
  logger.info({ url: `http://localhost:${PORT}/trpc` }, "[studiobase] tRPC endpoint");
  logger.info({ url: `http://localhost:${PORT}/api/health` }, "[studiobase] Health endpoint");
});
