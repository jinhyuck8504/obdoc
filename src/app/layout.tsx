import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/common/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Obdoc - 비만치료의 흐름을 설계하다",
  description: "브랜뉴메디가 제공하는 비만 클리닉 전용 고객 관리 솔루션. 의료진과 환자를 위한 전문적인 비만 관리 플랫폼",
  keywords: "오비닥, Obdoc, 브랜뉴메디, 비만 관리, 다이어트, 병원관리, 고객관리, 체중관리, 의료진, 클리닉",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <Layout>
                {children}
              </Layout>
              <Toaster />
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
