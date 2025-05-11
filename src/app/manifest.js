export default function manifest() {
  return {
    name: "مرکزیاب",
    short_name: "مرکزیاب",
    description: "A Progressive Web App built with Next.js",
    start_url: "/",
    display: "standalone",
    scope: "/",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/assets/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
