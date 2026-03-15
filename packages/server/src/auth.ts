import { createRemoteJWKSet, jwtVerify } from "jose";
import type { KeycloakTokenPayload, Role } from "@studiobase/shared";
import { logger } from "./lib/logger";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? "studiobase";

// JWKS endpoint for the realm
const JWKS_URI = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

// Cache the JWKS keyset (jose handles rotation automatically)
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URI));
  }
  return jwks;
}

export interface VerifiedToken {
  userId: string;
  email?: string;
  tenantId?: string;
  roles: Role[];
}

export async function verifyKeycloakToken(token: string): Promise<VerifiedToken> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getJwks(), {
      issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    }));
  } catch (err) {
    logger.warn({ err }, "[auth] Token verification failed");
    throw err;
  }

  const decoded = payload as unknown as KeycloakTokenPayload;

  // Extract roles from the "roles" claim (set by the protocol mapper)
  // Falls back to realm_access.roles if the custom mapper isn't present
  const rawRoles: string[] =
    decoded.roles ?? decoded.realm_access?.roles ?? [];

  const knownRoles: Role[] = ["super_admin", "tenant_admin", "teacher", "customer"];
  const roles = rawRoles.filter((r): r is Role => knownRoles.includes(r as Role));

  return {
    userId: decoded.sub,
    email: decoded.email,
    tenantId: decoded.tenantId,
    roles,
  };
}
