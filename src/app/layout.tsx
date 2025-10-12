import type { Metadata } from "next";
import "../styles/globals.css";


export const metadata: Metadata = {
  title: "모동숲 도감",
  description: "모동숲",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className="min-h-screen bg-cover bg-center bg-fixed relative"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 "></div> {/* 어두운 오버레이 */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
