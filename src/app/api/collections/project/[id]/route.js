import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Collection from "@/models/Collection";
import { NextResponse } from "next/server";

// Get collections that contain a specific project
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

    const user = await User.findById(authUser.userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const { id: projectId } = await params;

    // Find all collections that contain this project
    const collections = await Collection.find({
      user: user._id,
      projects: projectId,
      deletedAt: null,
    })
      .select("_id name")
      .lean();

    return NextResponse.json(
      {
        success: true,
        collections: collections.map((c) => ({
          _id: c._id,
          name: c.name,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get project collections error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت کالکشن‌های پروژه" },
      { status: 500 }
    );
  }
}
