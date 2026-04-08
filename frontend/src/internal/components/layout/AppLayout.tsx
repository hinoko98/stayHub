import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { SessionUser } from "../../types/types";

type AppLayoutProps = {
  user: SessionUser;
  onLogout: () => void;
};

export function AppLayout({ user, onLogout }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "app-shell-collapsed" : ""}`}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="app-main">
        <Header
          onLogout={onLogout}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          user={user}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
