import "./globals.css";
import "../css/styles.css";
import "@flaticon/flaticon-uicons/css/all/all.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "@/lib/AuthProvider";
import { getUser } from "@/lib/auth";
export const metadata = {
  title: "آموزشگاه سازک",
  description: "آموزشگاه رباتیک سازک",
};

export default async function RootLayout({ children }) {
  const user = await getUser();

  return (
    <html lang="fa" dir="rtl" className="">
      <body className="">
        <NextTopLoader color="#dc2626" showSpinner={false} />

        <AuthProvider userData={user} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
