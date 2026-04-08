import { Panel } from "../components/ui/Panel";
import { useAuth } from "../../context/AuthContext";

export function ProfilePage() {
  const { session } = useAuth();
  const user = session?.user;

  return (
    <div className="page-grid">
      <Panel title="Perfil del usuario" helpText="Informacion general de la cuenta activa en el sistema.">
        <div className="profile-card">
          <div className="profile-avatar">
            {(user?.firstName?.[0] || "H").toUpperCase()}
            {(user?.lastName?.[0] || "F").toUpperCase()}
          </div>

          <div className="profile-meta">
            <h2>
              {user?.firstName} {user?.lastName}
            </h2>
            <p>
              @{user?.username} - {user?.role}
            </p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-detail">
            <span>Nombre</span>
            <strong>{user?.firstName || "N/A"}</strong>
          </div>
          <div className="profile-detail">
            <span>Apellido</span>
            <strong>{user?.lastName || "N/A"}</strong>
          </div>
          <div className="profile-detail">
            <span>Usuario</span>
            <strong>@{user?.username || "N/A"}</strong>
          </div>
          <div className="profile-detail">
            <span>Rol</span>
            <strong>{user?.role || "N/A"}</strong>
          </div>
          <div className="profile-detail">
            <span>Estado</span>
            <strong>{user?.status || "N/A"}</strong>
          </div>
        </div>
      </Panel>
    </div>
  );
}
