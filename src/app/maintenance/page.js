import connectDB from "@/lib/db";
import Setting from "@/models/Setting";
import Image from "next/image";

export const metadata = {
  title: "سایت در حال بروزرسانی است",
};

export default async function Page() {
  await connectDB();
  const setting = await Setting.findOne().lean();
  const siteName = setting?.siteName || "سازک";
  const logo = setting?.logo || "/assets/logo.png";
  const message =
    setting?.maintenanceMessage || "سایت به‌زودی با امکانات جدید در دسترس خواهد بود.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-16 text-center">
      <div className="max-w-xl space-y-8 rounded-3xl border border-gray-200 bg-white p-10 shadow-xl shadow-gray-200/40">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <Image
              src={logo}
              alt={siteName}
              fill
              className="object-contain rounded-full p-4"
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">{siteName}</h1>
        </div>
        <div className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">در حال بروزرسانی</h2>
          <p className="leading-7">{message}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600">
          در صورت نیاز به پشتیبانی با تیم ما در ارتباط باشید.
        </div>
      </div>
    </div>
  );
}

