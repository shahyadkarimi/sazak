import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const requester = await User.findById(authUser.userId).lean();
    if (!requester) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Check if user is a coach
    if (requester.role !== "coach") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    // Find all users assigned to this coach
    const users = await User.find({
      coach: requester._id,
      deletedAt: null,
      isDeleted: { $ne: true },
    }).select("_id name familyName phoneNumber").lean();

    const userIds = users.map((u) => u._id);

    // Get all projects of these users
    const projects = await Project.find({
      user: { $in: userIds },
      deletedAt: null,
    })
      .select("_id name user createdAt objects image isPublic description")
      .populate({ path: "user", select: "name familyName phoneNumber" })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = projects.map((p) => ({
      id: p._id,
      image: p.image,
      name: p.name,
      description: p.description || "",
      userName: `${p.user?.name ?? ""} ${p.user?.familyName ?? ""}`.trim(),
      userPhoneNumber: p.user?.phoneNumber ?? "",
      userId: p.user?._id?.toString() || "",
      createdAt: p.createdAt,
      objectsCount: Array.isArray(p.objects) ? p.objects.length : 0,
      isPublic: p.isPublic || false,
    }));

    return NextResponse.json(
      {
        success: true,
        projects: mapped,
        users: users.map((u) => ({
          id: u._id,
          name: u.name,
          familyName: u.familyName,
          fullName: `${u.name} ${u.familyName}`,
          phoneNumber: u.phoneNumber,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Coach projects list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست پروژه‌ها" },
      { status: 500 }
    );
  }
}

