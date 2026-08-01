import BottomNav from "@/components/BottomNav";

// Shared by /dashboard, /rewards, and /history: keeps the bottom nav mounted across
// navigations so only the page content area shows a loading skeleton, not the whole shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
