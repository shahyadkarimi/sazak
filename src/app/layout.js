import "./globals.css";
import "../css/styles.css";
import "@flaticon/flaticon-uicons/css/all/all.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
export const metadata = {
  title: "آموزشگاه سازک",
  description: "آموزشگاه رباتیک سازک",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className="">
      <body className="">
        <NextTopLoader color="#dc2626" showSpinner={false} />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
