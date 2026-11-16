
import {
  createHmac,
  timingSafeEqual,
  scrypt as scryptCallback,
} from "crypto";

import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "internmatch_admin_session";
const SESSION_DURATION = 8 * 60 * 60;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Admin session secret is not configured.");
  }

  return secret;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split("$");

    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }

    const salt = Buffer.from(parts[1], "hex");
    const expectedHash = Buffer.from(parts[2], "hex");

    if (salt.length !== 16 || expectedHash.length !== 64) {
      return false;
    }

    const actualHash = await new Promise<Buffer>((resolve, reject) => {
      scryptCallback(
        password,
        salt,
        64,
        {
          N: 2 ** 14,
          r: 8,
          p: 1,
          maxmem: 64 * 1024 * 1024,
        },
        (error, derivedKey) => {
          if (error) reject(error);
          else resolve(derivedKey);
        }
      );
    });

    return timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export async function createAdminSession(userId: number) {
  const expiresAt =
    Math.floor(Date.now() / 1000) + SESSION_DURATION;

  const payload = Buffer.from(
    JSON.stringify({
      userId,
      role: "admin",
      expiresAt,
    })
  ).toString("base64url");

  const token = `${payload}.${signPayload(payload)}`;

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const [payload, signature] = token.split(".");

    if (!payload || !signature) return null;

    const expectedSignature = Buffer.from(signPayload(payload));
    const actualSignature = Buffer.from(signature);

    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      session.role !== "admin" ||
      !Number.isInteger(session.userId) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const result = await db.query(
      `SELECT user_id, email
       FROM users
       WHERE user_id = $1 AND role = 'admin'`,
      [session.userId]
    );

    if (result.rows.length === 0) return null;

    return {
      userId: Number(result.rows[0].user_id),
      email: result.rows[0].email as string,
    };
  } catch {
    return null;
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
