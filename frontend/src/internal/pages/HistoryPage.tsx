import { useEffect, useMemo, useState } from "react";
import { fetchList } from "../services/resources";
import { Panel } from "../components/ui/Panel";
import { StatusPill } from "../components/ui/StatusPill";

type ReservationHistory = {
  id: number;
  code: string;
  status: string;
  total: number;
  pendingBalance: number;
  client?: { firstName: string; lastName: string };
  room?: { number: string };
};

type PaymentHistory = {
  id: number;
  method: string;
  amountPaid: number;
  status: string;
  reservation?: {
    code: string;
    client?: { firstName: string; lastName: string };
  };
};

type ClientHistory = {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  primaryPhone: string;
  status: string;
};

type UserHistory = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  status: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [reservations, setReservations] = useState<ReservationHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [clients, setClients] = useState<ClientHistory[]>([]);
  const [users, setUsers] = useState<UserHistory[]>([]);

  useEffect(() => {
    Promise.all([
      fetchList<ReservationHistory>("/reservations?limit=100"),
      fetchList<PaymentHistory>("/payments?limit=100"),
      fetchList<ClientHistory>("/clients?limit=100"),
      fetchList<UserHistory>("/users?limit=100"),
    ])
      .then(([reservationsResponse, paymentsResponse, clientsResponse, usersResponse]) => {
        setReservations(reservationsResponse.items || []);
        setPayments(paymentsResponse.items || []);
        setClients(clientsResponse.items || []);
        setUsers(usersResponse.items || []);
      })
      .catch(() => undefined);
  }, []);

  const query = search.toLowerCase();

  const filteredReservations = useMemo(
    () =>
      reservations.filter((item) =>
        [item.code, item.client?.firstName, item.client?.lastName, item.room?.number].join(" ").toLowerCase().includes(query),
      ),
    [query, reservations],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((item) =>
        [item.method, item.reservation?.code, item.reservation?.client?.firstName, item.reservation?.client?.lastName]
          .join(" ")
          .toLowerCase()
          .includes(query),
      ),
    [payments, query],
  );

  const filteredClients = useMemo(
    () =>
      clients.filter((item) =>
        [item.firstName, item.lastName, item.documentNumber, item.primaryPhone].join(" ").toLowerCase().includes(query),
      ),
    [clients, query],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((item) =>
        [item.firstName, item.lastName, item.username, item.role].join(" ").toLowerCase().includes(query),
      ),
    [query, users],
  );

  return (
    <div className="page-grid">
      <Panel title="Historial integral" helpText="Consulta todo lo registrado en reservas, pagos, clientes y usuarios.">
        <div className="history-toolbar">
          <label className="field">
            <span className="field-label-row">Buscar en historial</span>
            <input
              placeholder="Codigo, cliente, usuario, habitacion o metodo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </Panel>

      <div className="dashboard-secondary-grid">
        <Panel title="Reservas" helpText="Movimientos principales de hospedaje.">
          <div className="history-stack">
            {filteredReservations.map((reservation) => (
              <article className="history-card" key={reservation.id}>
                <div className="history-card-top">
                  <div>
                    <strong>{reservation.code}</strong>
                    <p>
                      {(reservation.client?.firstName || "Sin cliente")} {reservation.client?.lastName || ""} - Hab.{" "}
                      {reservation.room?.number || "N/A"}
                    </p>
                  </div>
                  <StatusPill value={reservation.status} />
                </div>
                <div className="history-grid">
                  <div>
                    <span>Total</span>
                    <strong>{formatCurrency(reservation.total)}</strong>
                  </div>
                  <div>
                    <span>Saldo</span>
                    <strong>{formatCurrency(reservation.pendingBalance)}</strong>
                  </div>
                </div>
              </article>
            ))}
            {filteredReservations.length === 0 && <p className="empty-state">No hay reservas para mostrar.</p>}
          </div>
        </Panel>

        <Panel title="Pagos" helpText="Registros de adelantos y pagos de reserva.">
          <div className="history-stack">
            {filteredPayments.map((payment) => (
              <article className="history-card" key={payment.id}>
                <div className="history-card-top">
                  <div>
                    <strong>{payment.reservation?.code || "Pago"}</strong>
                    <p>
                      {(payment.reservation?.client?.firstName || "Sin cliente")}{" "}
                      {payment.reservation?.client?.lastName || ""}
                    </p>
                  </div>
                  <StatusPill value={payment.status} />
                </div>
                <div className="history-grid">
                  <div>
                    <span>Metodo</span>
                    <strong>{payment.method}</strong>
                  </div>
                  <div>
                    <span>Valor</span>
                    <strong>{formatCurrency(payment.amountPaid)}</strong>
                  </div>
                </div>
              </article>
            ))}
            {filteredPayments.length === 0 && <p className="empty-state">No hay pagos para mostrar.</p>}
          </div>
        </Panel>
      </div>

      <div className="dashboard-secondary-grid">
        <Panel title="Clientes" helpText="Base de clientes creada desde recepcion.">
          <div className="history-stack">
            {filteredClients.map((client) => (
              <article className="history-card" key={client.id}>
                <div className="history-card-top">
                  <div>
                    <strong>
                      {client.firstName} {client.lastName}
                    </strong>
                    <p>{client.documentNumber}</p>
                  </div>
                  <StatusPill value={client.status} />
                </div>
                <div className="history-grid">
                  <div>
                    <span>Telefono</span>
                    <strong>{client.primaryPhone}</strong>
                  </div>
                </div>
              </article>
            ))}
            {filteredClients.length === 0 && <p className="empty-state">No hay clientes para mostrar.</p>}
          </div>
        </Panel>

        <Panel title="Usuarios" helpText="Historial visible del equipo con acceso al sistema.">
          <div className="history-stack">
            {filteredUsers.map((user) => (
              <article className="history-card" key={user.id}>
                <div className="history-card-top">
                  <div>
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <p>@{user.username}</p>
                  </div>
                  <StatusPill value={user.status} />
                </div>
                <div className="history-grid">
                  <div>
                    <span>Rol</span>
                    <strong>{user.role}</strong>
                  </div>
                </div>
              </article>
            ))}
            {filteredUsers.length === 0 && <p className="empty-state">No hay usuarios para mostrar.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
