// Create CRM users (admin only). The caller sends their Firebase ID token;
// we verify it, check they're an admin, then create the new login via the
// Admin SDK and write a `users/{uid}` profile doc with role "user".

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// A user is an admin if they have no profile doc (the original owner) or their
// doc's role is "admin".
async function isAdmin(uid: string): Promise<boolean> {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return true;
  return (snap.data()?.role ?? "user") === "admin";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    if (!(await isAdmin(decoded.uid))) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const { email, password, name } = (await req.json()) as { email?: string; password?: string; name?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await adminAuth().createUser({
      email: email.trim(),
      password,
      displayName: (name || "").trim() || undefined,
    });

    await adminDb().collection("users").doc(user.uid).set({
      email: email.trim(),
      name: (name || "").trim() || email.trim(),
      role: "user",
      createdBy: decoded.uid,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true, uid: user.uid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Couldn't create user";
    // Friendlier message for the common duplicate case.
    const clean = /already exists/i.test(msg) ? "That email already has a login" : msg;
    console.error("users create error:", msg);
    return NextResponse.json({ error: clean }, { status: 500 });
  }
}
