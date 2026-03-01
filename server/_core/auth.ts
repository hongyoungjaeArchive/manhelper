import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createLocalUser, getUserByEmail, getUserByUsername } from "../db";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

/** 아이디 유효성 검사: 영문·숫자·언더스코어, 4~20자 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

function getBodyString(req: Request, key: string): string | undefined {
  const val = (req.body as any)?.[key];
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined;
}

export async function seedAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const existing = await getUserByEmail(adminEmail);
  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await createLocalUser({
    openId: `local:${adminEmail}`,
    email: adminEmail,
    name: "Admin",
    loginMethod: "local",
    passwordHash,
    role: "admin",
  } as any);
  console.log(`[Auth] Admin account created: ${adminEmail}`);
}

export function registerAuthRoutes(app: Express) {
  // 아이디 중복 체크 API
  app.get("/api/auth/check-username", async (req: Request, res: Response) => {
    const username = (req.query.username as string)?.trim();
    if (!username || !USERNAME_REGEX.test(username)) {
      res.json({ available: false, reason: "invalid" });
      return;
    }
    const existing = await getUserByUsername(username);
    res.json({ available: !existing });
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const username = getBodyString(req, "username");
    const password = getBodyString(req, "password");

    if (!username || !password) {
      res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요." });
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      res.status(400).json({ error: "아이디는 영문·숫자·언더스코어 조합 4~20자여야 합니다." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "비밀번호는 6자 이상이어야 합니다." });
      return;
    }

    try {
      const existing = await getUserByUsername(username);
      if (existing) {
        res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const openId = `local:${username}`;

      // username을 email 필드에 저장 (식별자로 활용)
      const user = await createLocalUser({
        openId,
        email: username,
        name: username,
        loginMethod: "local",
        passwordHash,
      } as any);

      if (!user) {
        res.status(500).json({ error: "계정 생성에 실패했습니다." });
        return;
      }

      const sessionToken = await sdk.createSessionToken(openId, { name: username });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("[Auth] Signup failed", error);
      res.status(500).json({ error: "회원가입에 실패했습니다." });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const username = getBodyString(req, "username");
    const password = getBodyString(req, "password");

    if (!username || !password) {
      res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요." });
      return;
    }

    try {
      const user = await getUserByUsername(username);
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
      res.status(500).json({ error: "로그인에 실패했습니다." });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
}
