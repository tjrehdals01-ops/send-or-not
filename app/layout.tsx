import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "보내도 돼? — 전송 전 30초",
  description: "보내고 후회하기 전에, 메시지의 위험 신호와 더 나은 선택을 확인하세요.",
  openGraph: {
    title: "보내도 돼?",
    description: "보내고 후회하기 전에, 전송 전 30초.",
    images: [{ url: "/og-card.png", width: 1678, height: 941 }],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={notoSansKr.variable}>{children}</body>
    </html>
  );
}
