import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { SIDE_PANEL_SLOT_ID } from "@/components/ui/side-panel-slot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar ownerName={process.env.DEMO_OWNER_NAME || "Collins"} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <div id={SIDE_PANEL_SLOT_ID} className="contents" />
      <BottomTabBar />
    </div>
  );
}
