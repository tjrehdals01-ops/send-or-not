import type { Metadata } from "next";
import { headers } from "next/headers";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

function getGoogleAnalyticsId() {
  const value = (process.env.GA_MEASUREMENT_ID || "G-XF7RSF6KNT").trim().toUpperCase();
  return value && /^G-[A-Z0-9]+$/.test(value) ? value : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "bonaedo-dwae.skku-boot5.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "보내도 돼? — 누구에게든, 보내기 전 한 번 더",
    description: "받는 사람과 목적을 정하고, 카카오톡·Instagram DM·이메일 문장을 한국어와 영어로 점검하세요.",
    openGraph: {
      title: "보내도 돼?",
      description: "카카오톡·DM·이메일의 원문과 수정문을 비교하는 메시지 점검 도구",
      images: [{ url: imageUrl, width: 1678, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "보내도 돼?",
      description: "카카오톡·DM·이메일의 원문과 수정문을 비교하는 메시지 점검 도구",
      images: [imageUrl],
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const googleAnalyticsId = getGoogleAnalyticsId();

  return (
    <html lang="ko">
      <head>
        {googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config','${googleAnalyticsId}',{send_page_view:true});`,
              }}
            />
          </>
        )}
      </head>
      <body className={notoSansKr.variable}>{children}</body>
    </html>
  );
}
