import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
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

export async function GET() {
  try {
    await connectDB();
    let setting = await Setting.findOne().lean();
    if (!setting) {
      setting = await Setting.create({});
      setting = setting.toObject();
    }
    return NextResponse.json(
      { success: true, setting: serializeSetting(setting) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Public settings get error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت تنظیمات" },
      { status: 500 }
    );
  }
}

