import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Schema Mind",
  description: "지식 구조화 인터페이스 연구 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <header className="topbar"><Link href="/" className="brand">Schema Mind</Link><nav><Link href="/cluster">수집</Link><Link href="/canvas">검토</Link><Link href="/schema">통합</Link><Link href="/study/demo-001">실험</Link></nav></header>
        {children}
      </body>
    </html>
  );
}
