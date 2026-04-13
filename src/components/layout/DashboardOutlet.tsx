/**
 * DashboardOutlet — renders Dashboard + SoulChatPanel inside AppShell Outlet
 */
import { useOutletContext } from "react-router-dom";
import SoulChatPanel from "../chat/SoulChatPanel";
import Dashboard from "../dashboard/Dashboard";

export default function DashboardOutlet() {
  const { souls, selectedSoul, selectedSoulId, setSelectedSoulId, navigate, refreshSouls } = useOutletContext<any>();

  if (selectedSoul) {
    return (
      <SoulChatPanel
        soulId={selectedSoul.id}
        soulName={selectedSoul.name}
        soulNameKo={selectedSoul.name_ko || selectedSoul.name}
        soulRole={selectedSoul.role}
        soulAvatar=""
        department={selectedSoul.department || "general"}
        onClose={() => navigate("/")}
        embedded
      />
    );
  }

  return (
    <Dashboard
      onChatWithSoul={(id: string) => {
        const soul = souls.find((s: any) => s.id === id);
        if (soul) setSelectedSoulId(soul);
      }}
      onNavigate={(path: string) => navigate(path)}
      onRefresh={refreshSouls}
    />
  );
}
