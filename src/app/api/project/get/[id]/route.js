import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import Part from "@/models/Part";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const { id } = params;

    const requestUser = await User.findById(authUser.userId)
      .select("role _id")
      .lean();

    // First, get the project to check ownership/coach relationship
    let project = await Project.findById(id)
      .populate({ path: "user", select: "coach" })
      .lean();

    if (!project || project.deletedAt) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions: admin can see all, coach can see their users' projects, user can see only their own
    let hasPermission = false;
    if (requestUser?.role === "admin") {
      hasPermission = true;
    } else if (requestUser?.role === "coach") {
      // Check if the project owner has this coach assigned
      const projectOwner = project.user;
      if (projectOwner && projectOwner.coach && projectOwner.coach.toString() === requestUser._id.toString()) {
        hasPermission = true;
      }
    } else if (project.user && project.user._id?.toString() === authUser.userId) {
      // User owns the project
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: "شما دسترسی مشاهده این پروژه را ندارید" },
        { status: 403 }
      );
    }

    // Remove user field from response and prepare project object
    const projectObj = { ...project };
    delete projectObj.user;

    // Attach part dimensions (length, width, height) to project objects when available
    try {

      // Use object `path` to find matching Part documents (match against Part.glbPath)
      const partPaths = (projectObj.objects || [])
        .map((o) => (o && o.path ? o.path : null))
        .filter(Boolean);

      if (partPaths.length > 0) {
        const parts = await Part.find({ glbPath: { $in: partPaths } }).lean();
        const partsByPath = {};
        parts.forEach((p) => {
          if (p.glbPath) partsByPath[p.glbPath] = p;
        });

        projectObj.objects = (projectObj.objects || []).map((obj) => {
          const pathKey = obj?.path || null;
          const part = pathKey ? partsByPath[pathKey] : null;
          return {
            ...obj,
            length: part ? part.length : null,
            width: part ? part.width : null,
            height: part ? part.height : null,
            noColor: obj.noColor !== undefined ? obj.noColor : (part ? (part.noColor || false) : false),
          };
        });
      } else {
        projectObj.objects = (projectObj.objects || []).map((obj) => ({
          ...obj,
          noColor: obj.noColor !== undefined ? obj.noColor : false,
        }));
      }

      return NextResponse.json({ success: true, project: projectObj }, { status: 200 });
    } catch (e) {
      console.error("Attach parts dimensions error:", e);
      // Fallback to returning original project if augmentation fails
      const fallbackProject = { ...project };
      delete fallbackProject.user;
      return NextResponse.json({ success: true, project: fallbackProject }, { status: 200 });
    }
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت پروژه" },
      { status: 500 }
    );
  }
}
