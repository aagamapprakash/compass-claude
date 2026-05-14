import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
}

// Service-role client used server-side only — never exposed to the browser.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function setupAuth(app: Express) {
  // No session middleware needed — auth is stateless JWT via Authorization header.
}

export function registerAuthRoutes(app: Express) {
  // Returns the current user's profile from our DB (auto-upserted on first request).
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    // JWT auth is stateless — logout is handled entirely on the client by
    // calling supabase.auth.signOut(), which discards the local token.
    res.json({ ok: true });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabaseUser = data.user;

  // Sync profile into our users table on every request (upsert is idempotent).
  const user = await authStorage.upsertUser({
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    firstName: supabaseUser.user_metadata?.first_name ?? supabaseUser.user_metadata?.full_name?.split(" ")[0] ?? null,
    lastName: supabaseUser.user_metadata?.last_name ?? (supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null),
    profileImageUrl: supabaseUser.user_metadata?.avatar_url ?? null,
  });

  (req as any).user = user;
  next();
};
