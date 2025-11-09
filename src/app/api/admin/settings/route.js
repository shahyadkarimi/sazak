import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import Setting from "@/models/Setting";

const serializeSetting = (setting) => ({
  id: setting._id,
  siteName: setting.siteName ?? "",
  siteEmail: setting.siteEmail ?? "",
  siteDescription: setting.siteDescription ?? "",
  logo: setting.logo ?? "",
  maintenanceMode: Boolean(setting.maintenanceMode),
  maintenanceMessage: setting.maintenanceMessage ?? "",
});

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
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    let setting = await Setting.findOne().lean();
    if (!setting) {
      setting = await Setting.create({
        updatedBy: requester._id,
      });
      setting = setting.toObject();
    }

    return NextResponse.json(
      { success: true, setting: serializeSetting(setting) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin settings get error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت تنظیمات" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
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

    const body = await req.json();
    const payload = {};

    if (typeof body.siteName === "string") {
      payload.siteName = body.siteName.trim();
    }
    if (typeof body.siteEmail === "string") {
      payload.siteEmail = body.siteEmail.trim();
    }
    if (typeof body.logo === "string") {
      payload.logo = body.logo.trim();
    }
    if (typeof body.siteDescription === "string") {
      payload.siteDescription = body.siteDescription.trim();
    }
    if (typeof body.maintenanceMessage === "string") {
      payload.maintenanceMessage = body.maintenanceMessage.trim();
    }
    if (typeof body.maintenanceMode === "boolean") {
      payload.maintenanceMode = body.maintenanceMode;
    }

    payload.updatedBy = requester._id;

    const setting = await Setting.findOneAndUpdate(
      {},
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(
      {
        success: true,
        message: "تنظیمات با موفقیت بروزرسانی شد",
        setting: serializeSetting(setting),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام بروزرسانی تنظیمات" },
      { status: 500 }
    );
  }
}

