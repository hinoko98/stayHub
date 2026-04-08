import { NavLink } from "react-router-dom";
import { navigation } from "../../data/navigation";

type SidebarProps = {
  collapsed: boolean;
};

type NavIconProps = {
  path: string;
};

function NavIcon({ path }: NavIconProps) {
  if (path === "/management") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }

  if (path === "/management/rooms") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10H4z" />
        <path d="M4 12h16" />
        <path d="M7 9.5h2.5M7 15h2.5M13 9.5h4M13 15h4" />
      </svg>
    );
  }

  if (path === "/management/clients") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 18a5.5 5.5 0 0 1 11 0" />
        <circle cx="17.5" cy="9" r="2.5" />
        <path d="M14.5 18a4.5 4.5 0 0 1 6 0" />
      </svg>
    );
  }

  if (path === "/management/history") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 4h12a1 1 0 0 1 1 1v14l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  }

  if (path === "/management/settings") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3.2" />
        <path d="m12 3 1 2.4 2.7.5-.9 2.6 1.9 2-1.9 2 .9 2.6-2.7.5-1 2.4-1-2.4-2.7-.5.9-2.6-1.9-2 1.9-2-.9-2.6 2.7-.5z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <strong>{collapsed ? "MH" : "MI HOTEL"}</strong>
        {!collapsed && <span>Recepcion, reservas y control diario</span>}
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
            end={item.path === "/"}
            title={item.label}
          >
            <span className="sidebar-link-main">
              <span className="sidebar-icon-wrap">
                <NavIcon path={item.path} />
              </span>
              {!collapsed && <span className="sidebar-link-text">{item.label}</span>}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
