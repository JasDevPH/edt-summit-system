import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EDT Summit Management System",
    short_name: "EDT Summit",
    description: "Manage events, participants, expenses, and financial reports",
    start_url: "/",
    display: "standalone",
    theme_color: "#4f46e5",
    background_color: "#f5f3ff",
    icons: [
      {
        src: "/edt logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/edt logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
