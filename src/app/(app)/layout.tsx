import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { Sidebar } from "@/components/shell/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar ownerName={process.env.DEMO_OWNER_NAME || "Collins"} />
      <main className="min-w-0 flex-1 pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-0">{children}</main>
      <BottomTabBar />
    </div>
  );
}
