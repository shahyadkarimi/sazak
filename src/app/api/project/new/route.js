import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { newProjectSchema } from "@/lib/validation";
import { createLog, LogActions } from "@/lib/logger";

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

    const userInfo = await User.findById(authUser.userId)
      .select("name familyName phoneNumber role")
      .lean();

    await createLog(LogActions.PROJECT_CREATE, {
      performedBy: userInfo
        ? {
            userId: userInfo._id,
            name: userInfo.name,
            familyName: userInfo.familyName,
            phoneNumber: userInfo.phoneNumber,
            role: userInfo.role,
          }
        : {
            userId: authUser.userId,
            phoneNumber: authUser.phoneNumber,
          },
      target: {
        type: "project",
        projectId: project._id.toString(),
        name: project.name,
      },
      metadata: {
        description: project.description,
      },
      request: req,
    });

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
