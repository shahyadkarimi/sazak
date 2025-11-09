import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createLog, LogActions } from "@/lib/logger";

export async function POST(req, { params }) {
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
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }

    const targetUser = await User.findOne({
      _id: id,
      deletedAt: null,
      isDeleted: { $ne: true },
    })
      .select(
        "_id name familyName phoneNumber role isActive createdAt profilePicture"
      )
      .lean();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    if (!targetUser.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "امکان ورود به حساب کاربر غیرفعال وجود ندارد",
        },
        { status: 400 }
      );
    }

    const token = jwt.sign(
      {
        userId: targetUser._id,
        phoneNumber: targetUser.phoneNumber,
        impersonatedBy: requester._id,
        impersonatedAt: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await createLog(LogActions.ADMIN_USER_IMPERSONATE_START, {
      performedBy: {
        userId: requester._id,
        name: requester.name,
        familyName: requester.familyName,
        phoneNumber: requester.phoneNumber,
        role: requester.role,
      },
      target: {
        type: "user",
        userId: targetUser._id.toString(),
        phoneNumber: targetUser.phoneNumber,
      },
      metadata: {
        expiresIn: "1h",
      },
      request: req,
    });

    return NextResponse.json(
      {
        success: true,
        message: "ورود موقت به حساب کاربر ایجاد شد",
        token,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          familyName: targetUser.familyName,
          fullName: `${targetUser.name} ${targetUser.familyName}`,
          phoneNumber: targetUser.phoneNumber,
          role: targetUser.role,
          profilePicture: targetUser.profilePicture,
          createdAt: targetUser.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user impersonate error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ورود به حساب کاربر" },
      { status: 500 }
    );
  }
}

