import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/common/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { DensityProvider } from "@/contexts/DensityContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Obdoc - 비만 관리의 흐름을 설계하다",
  description: "대한민국 모든 비만 클리닉과 고객들을 연결하는 필수적인 파트너",
  keywords: "비만 관리, 다이어트, 병원관리, 고객관리, 체중관리",
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
            <DensityProvider>
              <AuthProvider>
                <Layout>
                  {children}
                </Layout>
              </AuthProvider>
            </DensityProvider>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
