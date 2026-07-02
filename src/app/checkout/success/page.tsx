"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getPackage } from "@/lib/products";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#2563eb";

function SuccessInner() {
  const params = useSearchParams();
  const { t } = useI18n();
  const pkg = getPackage(params.get("pkg") || "");
  const body1 = pkg
    ? t.success.bodyWithPkg.replace("{pkg}", t.packages[pkg.key].name)
    : t.success.bodyNoPkg;

  return (
    <>
      <Nav />
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#e3edff",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px",
            fontSize: 30, color: ACCENT,
          }}>
            ✓
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-1px", marginBottom: 16, color: "#0b1b3b" }}>
            {t.success.heading}
          </h1>
          <p style={{ fontSize: 16, color: "#44516b", lineHeight: 1.7, marginBottom: 12 }}>
            {body1}
          </p>
          <p style={{ fontSize: 15, color: "#7c89a3", lineHeight: 1.7, marginBottom: 36 }}>
            {t.success.body2}
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block", padding: "14px 28px", background: ACCENT, color: "#fff",
              borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 15,
            }}
          >
            {t.success.backHome}
          </Link>
        </div>
      </section>
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
