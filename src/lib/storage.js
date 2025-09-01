"use server";
import "server-only";

import { cookies } from "next/headers";
import { baseURL } from "@/services/API";
import { redirect } from "next/navigation";

// export const cookieName = "token"

export async function saveSession(data) {
  (await cookies()).set("token", data, {
    httpOnly: true,
  });
}

export async function getUser() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const userRes = await fetch(`${baseURL}/user/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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

export async function tokenExpired() {
  (await cookies()).delete("token");

  redirect("/auth");
}
