import type { ApiKey } from "@prisma/client";

import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/api-keys";

export type ApiAuthResult =
  | { success: true; apiKey: ApiKey }
  | { success: false; status: number; error: string };

// Authenticates a request to /api/v1/* using a Bearer API key, and records
// usage on the key. The returned `apiKey.orgId` scopes all data access.
export const authenticateApiRequest = async (req: Request): Promise<ApiAuthResult> => {
  const authHeader = req.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return {
      success: false,
      status: 401,
      error: "Missing or invalid Authorization header. Use 'Authorization: Bearer <api_key>'.",
    };
  }

  const apiKey = await db.apiKey.findUnique({ where: { hashedKey: hashApiKey(token) } });

  if (!apiKey || apiKey.revokedAt) {
    return { success: false, status: 401, error: "Invalid or revoked API key." };
  }

  await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });

  return { success: true, apiKey };
};
