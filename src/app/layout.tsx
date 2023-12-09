import type { Metadata } from "next";
import "@/styles/globals.css";
import Header from "@/components/layouts/header";

export const metadata: Metadata = {
  title: "Tech Blog by blan19",
  description: "Tech Blog by blan19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-greyscale-0 text-greyscale-9 dark:bg-greyscale-9 dark:text-greyscale-0"
    >
      <body>
        <Header />
        <main className="responsive pt-12">{children}</main>
      </body>
    </html>
  );
}
