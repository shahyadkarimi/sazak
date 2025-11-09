import "./globals.css";
import "../css/styles.css";
import "@flaticon/flaticon-uicons/css/all/all.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "@/lib/AuthProvider";
import { getUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import Setting from "@/models/Setting";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { baseURL } from "@/services/API";
import CheckMaintenance from "@/lib/CheckMaintenance";

export async function generateMetadata() {
  await connectDB();
  const setting = await Setting.findOne().lean();
  const siteName = setting?.siteName || "آموزشگاه سازک";
  const description = setting?.siteDescription || "آموزشگاه رباتیک سازک";
  return {
    title: siteName,
    description,
  };
}

export default async function RootLayout({ children, params }) {
  const user = await getUser();

  const fetchSettings = async () => {
    const response = await fetch(`${baseURL}/settings`, { cache: "no-store" });
    const data = await response.json();
    return data;
  };

  const { setting } = await fetchSettings();

  return (
    <html lang="fa" dir="rtl" className="">
      <body className="">
        <NextTopLoader color="#a600ff" showSpinner={false} />
        <CheckMaintenance maintenanceMode={setting?.maintenanceMode} />
        <AuthProvider userData={user} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
