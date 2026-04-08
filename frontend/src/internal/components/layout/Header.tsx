import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SessionUser } from "../../types/types";

type HeaderProps = {
  user: SessionUser;
  onLogout: () => void;
  onToggleSidebar: () => void;
};

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/management": {
    title: "Dashboard",
    subtitle: "Resumen rapido del hotel y del estado operativo actual.",
  },
  "/management/rooms": {
    title: "Habitaciones",
    subtitle: "Reserva desde la cuadricula por piso, cama y disponibilidad.",
  },
  "/management/clients": {
    title: "Clientes",
    subtitle: "Base principal de clientes y responsables de reserva.",
  },
  "/management/history": {
    title: "Historial",
    subtitle: "Consulta reservas, clientes, pagos y usuarios desde un solo lugar.",
  },
  "/management/users": {
    title: "Usuarios",
    subtitle: "Gestion del equipo con acceso al sistema hotelero.",
  },
  "/management/profile": {
    title: "Perfil",
    subtitle: "Informacion de la cuenta activa y datos del usuario.",
  },
  "/management/settings": {
    title: "Configuracion",
    subtitle: "Parametros operativos para personalizar la recepcion.",
  },
};

export function Header({ user, onLogout, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPage =
    location.pathname.startsWith("/management/rooms/") && location.pathname.endsWith("/reserva")
      ? {
          title: "Reserva",
          subtitle: "Registro completo del cliente, acompanantes, fechas y pago.",
        }
      : pageMeta[location.pathname] || pageMeta["/management"];
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  const goTo = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button aria-label="Alternar menu" className="menu-toggle-button" onClick={onToggleSidebar} type="button">
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className="eyebrow">HotelFlow</p>
          <h1>{currentPage.title}</h1>
          <span className="topbar-subtitle">{currentPage.subtitle}</span>
        </div>
      </div>

      <div className="topbar-user-menu">
        <button className="user-menu-trigger" onClick={() => setMenuOpen((value) => !value)} type="button">
          <span className="user-avatar">{initials || "HF"}</span>
          <span className="user-menu-text">
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <small>
              {user.role} - @{user.username}
            </small>
          </span>
        </button>

        {menuOpen && (
          <div className="user-menu-dropdown">
            <button className="user-menu-link" onClick={() => goTo("/management/profile")} type="button">
              Perfil
            </button>
            <button className="user-menu-link" onClick={() => goTo("/management/settings")} type="button">
              Configuracion
            </button>
            <button className="user-menu-link" onClick={() => goTo("/management/history")} type="button">
              Historial
            </button>
            <button
              className="user-menu-link user-menu-logout"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              type="button"
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
