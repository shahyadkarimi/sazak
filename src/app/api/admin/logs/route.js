import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import Log from "@/models/Log";

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

    const requester = await User.findById(authUser.userId)
      .select("role")
      .lean();

    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limitRaw = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(),
    ]);

    const performedByIds = logs
      .map((log) => (log.performedBy && log.performedBy.userId ? log.performedBy.userId.toString() : null))
      .filter(Boolean);

    const uniqueUserIds = [...new Set(performedByIds)];

    let usersMap = new Map();

    if (uniqueUserIds.length) {
      const users = await User.find({ _id: { $in: uniqueUserIds } })
        .select("_id name familyName phoneNumber role profilePicture")
        .lean();

      usersMap = new Map(
        users.map((user) => [
          user._id.toString(),
          {
            id: user._id.toString(),
            name: user.name,
            familyName: user.familyName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profilePicture: user.profilePicture,
          },
        ])
      );
    }

    const formatted = logs.map((log) => {
      const performedByUser = log.performedBy && log.performedBy.userId ? usersMap.get(log.performedBy.userId.toString()) : undefined;

      const performedBy =
        log.performedBy || performedByUser
          ? {
              userId: (log.performedBy && log.performedBy.userId) || (performedByUser && performedByUser.id),
              name: (log.performedBy && log.performedBy.name) || (performedByUser && performedByUser.name),
              familyName:
                (log.performedBy && log.performedBy.familyName) || (performedByUser && performedByUser.familyName),
              phoneNumber:
                (log.performedBy && log.performedBy.phoneNumber) || (performedByUser && performedByUser.phoneNumber),
              role: (log.performedBy && log.performedBy.role) || (performedByUser && performedByUser.role),
              profilePicture:
                (log.performedBy && log.performedBy.profilePicture) || (performedByUser && performedByUser.profilePicture),
            }
          : undefined;

      return {
        id: log._id,
        action: log.action,
        performedBy,
        target: log.target,
        metadata: log.metadata,
        context: log.context,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        logs: formatted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin logs list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست لاگ‌ها" },
      { status: 500 }
    );
  }
}


