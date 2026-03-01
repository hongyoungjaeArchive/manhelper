import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createLocalUser, getUserByEmail } from "../db";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

function getBodyString(req: Request, key: string): string | undefined {
  const val = (req.body as any)?.[key];
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined;
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const email = getBodyString(req, "email");
    const password = getBodyString(req, "password");
    const name = getBodyString(req, "name") ?? null;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "User already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const openId = `local:${email}`;

      const user = await createLocalUser({
        openId,
        email,
        name,
        loginMethod: "local",
        passwordHash,
      } as any);

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(openId, { name: name ?? "" });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("[Auth] Signup failed", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const email = getBodyString(req, "email");
    const password = getBodyString(req, "password");

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    try {
      const user = await getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const match = await bcrypt.compare(password, user.passwordHash as string);
      if (!match) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
}
