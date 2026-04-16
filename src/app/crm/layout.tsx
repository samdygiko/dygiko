import { AuthProvider } from "@/context/AuthContext";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
