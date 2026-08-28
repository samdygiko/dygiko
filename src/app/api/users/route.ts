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

/**
 * List team members from Firebase Auth (not Firestore).
 *
 * Firestore only knows about accounts created through this tab, so an account
 * made any other way was invisible here — the list looked empty while the email
 * was still taken, and "no profile doc" silently meant admin. Reading Auth is
 * the source of truth: every real login shows up, orphans included.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    if (!(await isAdmin(decoded.uid))) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const [list, profiles] = await Promise.all([
      adminAuth().listUsers(1000),
      adminDb().collection("users").get(),
    ]);
    const byUid = new Map(profiles.docs.map((d) => [d.id, d.data()]));

    const users = list.users.map((u) => {
      const p = byUid.get(u.uid);
      return {
        id: u.uid,
        email: u.email || "",
        name: p?.name || u.displayName || u.email || "",
        role: p?.role || "admin", // no profile => treated as admin by isAdmin()
        orphaned: !p,
        isSelf: u.uid === decoded.uid,
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Couldn't load users";
    console.error("users list error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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

    const cleanEmail = email.trim();
    const cleanName = (name || "").trim() || cleanEmail;

    // An email can already exist in Firebase Auth without a users/{uid} profile
    // — an account created before this tab existed, or one whose profile was
    // deleted. Creating it again throws, and the tab looked empty because the
    // list reads Firestore, not Auth. So adopt the existing account: reset its
    // password to what the admin just typed and write the missing profile.
    //
    // This also closes a hole: isAdmin() treats "no profile doc" as admin, so
    // an orphaned Auth account silently had admin rights.
    let user;
    let reclaimed = false;
    try {
      user = await adminAuth().createUser({
        email: cleanEmail,
        password,
        displayName: cleanName,
      });
    } catch (e) {
      const code = (e as { code?: string }).code || "";
      if (code !== "auth/email-already-exists") throw e;
      const existing = await adminAuth().getUserByEmail(cleanEmail);
      user = await adminAuth().updateUser(existing.uid, {
        password,
        displayName: cleanName,
      });
      reclaimed = true;
    }

    await adminDb().collection("users").doc(user.uid).set({
      email: cleanEmail,
      name: cleanName,
      role: "user",
      createdBy: decoded.uid,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true, uid: user.uid, reclaimed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Couldn't create user";
    // Friendlier message for the common duplicate case.
    const clean = /already exists/i.test(msg) ? "That email already has a login" : msg;
    console.error("users create error:", msg);
    return NextResponse.json({ error: clean }, { status: 500 });
  }
}

/**
 * Remove a team member: deletes the Firebase Auth login and the profile doc.
 * Deleting only the profile would leave the login working *and* silently
 * promote them to admin, since isAdmin() treats a missing profile as the owner.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    if (!(await isAdmin(decoded.uid))) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const { uid } = (await req.json()) as { uid?: string };
    if (!uid) return NextResponse.json({ error: "Missing user" }, { status: 400 });
    if (uid === decoded.uid) {
      return NextResponse.json({ error: "You can't remove your own login" }, { status: 400 });
    }

    await adminAuth().deleteUser(uid).catch(() => {}); // may already be gone
    await adminDb().collection("users").doc(uid).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Couldn't remove user";
    console.error("users delete error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
