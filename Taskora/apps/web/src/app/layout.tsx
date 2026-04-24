import "./globals.css";
import { ReactNode } from "react";
import Providers from "./Providers";

export const metadata = {
  title: "Task Management System",
  description: "Internship Project",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}