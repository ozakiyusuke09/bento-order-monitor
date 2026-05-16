import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "弁当屋 受注モニター",
  description: "社内テスト用の弁当屋向け受注モニターMVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
