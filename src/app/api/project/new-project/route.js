import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
import { newProjectSchema } from "@/lib/validation";

export async function POST(req) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { name, description } = newProjectSchema.parse(body);

    const project = new Project({
      user: authUser.userId,
      name,
      description: description || "",
      objects: [],
    });

    await project.save();

    return NextResponse.json(
      { success: true, message: "پروژه جدید ایجاد شد", project },
      { status: 200 }
    );
  } catch (error) {
    if (error.name === "ZodError") {
      const formattedErrors = error.issues.map((issue) => ({
        name: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        { success: false, errors: formattedErrors },
        { status: 400 }
      );
    }

    console.error("Create project error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ایجاد پروژه" },
      { status: 500 }
    );
  }
}
