"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type DialerApi = {
  ready: () => Promise<void>;
  dialNumber: (n: string) => void;
  on: (ev: string, cb: (d: unknown) => void) => void;
};

declare global {
  interface Window {
    __dgDialer?: DialerApi;
    __dgDialCurrentLeadId?: string | null;
    __dgDialOnCallEnded?: (leadId: string) => void;
  }
}

let dialerInstance: DialerApi | null = null;

export function dialViaJustCall(phone: string, leadId: string) {
  if (typeof window === "undefined") return;
  window.__dgDialCurrentLeadId = leadId;
  window.dispatchEvent(new CustomEvent("dg:dial", { detail: { phone, leadId } }));
}

export default function JustCallDialerPanel({
  onCallEnded,
}: {
  onCallEnded?: (leadId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pendingNumber = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    window.__dgDialOnCallEnded = onCallEnded;
  }, [onCallEnded]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;
    (async () => {
      const mod = await import("@justcall/justcall-dialer-sdk");
      if (cancelled) return;
      const JustCallDialer = mod.JustCallDialer;
      dialerInstance = new JustCallDialer({
        dialerId: "justcall-dialer",
        onLogin: () => setLoggedIn(true),
        onLogout: () => setLoggedIn(false),
        onReady: () => setReady(true),
      }) as unknown as DialerApi;
      window.__dgDialer = dialerInstance;

      dialerInstance.on("call-ended", () => {
        const id = window.__dgDialCurrentLeadId;
        if (id && window.__dgDialOnCallEnded) window.__dgDialOnCallEnded(id);
      });
    })();

    const handler = async (e: Event) => {
      const ev = e as CustomEvent<{ phone: string; leadId: string }>;
      const phone = ev.detail?.phone;
      if (!phone) return;
      setOpen(true);
      if (!dialerInstance) {
        pendingNumber.current = phone;
        return;
      }
      try {
        await dialerInstance.ready();
        dialerInstance.dialNumber(phone);
      } catch {
        pendingNumber.current = phone;
      }
    };
    window.addEventListener("dg:dial", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("dg:dial", handler);
    };
  }, []);

  useEffect(() => {
    if (ready && pendingNumber.current && dialerInstance) {
      const n = pendingNumber.current;
      pendingNumber.current = null;
      dialerInstance.dialNumber(n);
    }
  }, [ready]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <>
      <div
        className="fixed z-40 rounded-lg overflow-hidden shadow-2xl transition-transform"
        style={{
          bottom: "1rem",
          right: "1rem",
          width: "365px",
          height: "634px",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateY(0)" : "translateY(calc(100% + 2rem))",
        }}
      >
        <div
          className="flex items-center justify-between px-2.5 py-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#111" }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
            <span style={{ color: "#b0ff00" }}>☎</span>
            JustCall {!loggedIn && ready && <span style={{ color: "rgba(176,255,0,0.6)" }}>· sign in</span>}
          </div>
          <button
            onClick={toggle}
            className="p-1 rounded transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.5)" }}
            title="Minimize"
          >
            —
          </button>
        </div>
        <div id="justcall-dialer" style={{ width: "100%", height: "calc(100% - 24px)" }} />
      </div>

      {!open && (
        <button
          onClick={toggle}
          className="fixed z-40 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-opacity hover:opacity-90"
          style={{
            bottom: "1rem",
            right: "1rem",
            background: "rgba(176,255,0,0.12)",
            color: "#b0ff00",
            border: "1px solid rgba(176,255,0,0.3)",
          }}
          title="Open JustCall dialer"
        >
          ☎ Dialer
        </button>
      )}
    </>
  );
}
