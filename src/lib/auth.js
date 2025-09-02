"use server";
import "server-only";

import { cookies } from "next/headers";
import { baseURL } from "@/services/API";
import { redirect } from "next/navigation";
import { verifyToken } from "./jwt";

// export const cookieName = "token"

export async function saveSession(data) {
  (await cookies()).set("token", data, {
    httpOnly: true,
  });
}

export async function getUser() {
  const token = (await cookies()).get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const userRes = await fetch(`${baseURL}/user/profile`, {
      method: "GET",
      headers: {
        "x-auth-token": `${token}`,
      },
    });

    const userData = await userRes.json();

    return userData;
  } catch (error) {
    console.log(error);
  }
}

export async function removeSession() {
  (await cookies()).delete("token");
}

export async function getAuthUser(request) {
  try {
    const token =
      request.cookies.get("auth-token")?.value ||
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
