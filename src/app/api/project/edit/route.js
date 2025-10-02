import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
import { editProjectSchema } from "@/lib/validation";


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

    const { id, name, description } = editProjectSchema.parse(body);

    const project = await Project.findOneAndUpdate(
      { _id: id, user: authUser.userId },
      { $set: { name, description: description || "" } },
      { new: true }
    );

    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "پروژه بروزرسانی شد", project },
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

    console.error("Edit project error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام بروزرسانی پروژه" },
      { status: 500 }
    );
  }
}


