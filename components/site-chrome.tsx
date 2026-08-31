"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/cluster", label: "수집" },
  { href: "/canvas", label: "검토" },
  { href: "/schema", label: "통합" },
  { href: "/study/demo-001", label: "실험" },
] as const;

export function SiteChrome() {
  const pathname = usePathname();
  const inStudySession = pathname?.startsWith("/study/") ?? false;

  if (inStudySession) {
    return (
      <header className="session-topbar">
        <Link href="/" className="brand">Schema Mind</Link>
        <span className="badge badge--proposed">참가자 세션 진행 중</span>
      </header>
    );
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand">Schema Mind</Link>
      <nav>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
