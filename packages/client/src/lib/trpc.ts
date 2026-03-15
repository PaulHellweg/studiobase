import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
// AppRouter type imported from server — works via pnpm workspace + TS project references
import type { AppRouter } from "../../../server/src/routers";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient(getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/trpc",
        headers() {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
