"use server";
import "server-only";

import { cookies } from "next/headers";
import { baseURL } from "@/services/API";
import { redirect } from "next/navigation";
import { verifyToken } from "./jwt";

// export const cookieName = "token"

export async function saveSession(data) {
  const cookieStore = await cookies();
  cookieStore.set("token", data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getUser() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("impersonation_token")?.value ||
    cookieStore.get("token")?.value;

    
    if (!token) {
    return null;
  }

  try {
    const userRes = await fetch(`${baseURL}/user/profile`, {
      method: "GET",
      headers: {
        "x-auth-token": `${token}`,
      },
      cache: "no-store",
    });

    const userData = await userRes.json();

    return userData;
  } catch (error) {
    console.log(error);
  }
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("impersonation_token");
  cookieStore.delete("impersonated");
}

export async function clearImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete("impersonation_token");
  cookieStore.delete("impersonated");
  return;
}

export async function getAuthUser(request) {
  try {
    const token =
      request.cookies.get("impersonation_token")?.value ||
      request.cookies.get("token")?.value ||
      request.headers.get("x-auth-token");

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}
