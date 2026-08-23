"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export type CrmUser = {
  uid: string | null;
  name: string;
  email: string;
  isAdmin: boolean;
  loading: boolean;
};

// Current signed-in CRM user + role. A user with no `users/{uid}` profile doc
// is treated as an admin (the original owner); users created via the Users tab
// get a doc with role "user".
export function useCrmUser(): CrmUser {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(false); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.exists() ? snap.data() : null;
      setRole(data?.role ?? null); // null = no doc = admin (owner)
      setName(data?.name || user.displayName || user.email || "");
      setChecked(true);
    }, () => setChecked(true));
    return unsub;
  }, [user]);

  return {
    uid: user?.uid ?? null,
    name: name || user?.email || "",
    email: user?.email ?? "",
    isAdmin: role === null || role === "admin",
    loading: !!user && !checked,
  };
}
