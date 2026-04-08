import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Guard } from "./components/Guard";
import { HomePage } from "./pages/HomePage";
import { HotelDetailPage } from "./pages/HotelDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OwnerAccessPage } from "./pages/OwnerAccessPage";
import { AppLayout as InternalAppLayout } from "./internal/components/layout/AppLayout";
import { DashboardPage } from "./internal/pages/DashboardPage";
import { RoomsPage } from "./internal/pages/RoomsPage";
import { RoomReservationPage } from "./internal/pages/RoomReservationPage";
import { ClientsPage } from "./internal/pages/ClientsPage";
import { HistoryPage } from "./internal/pages/HistoryPage";
import { ProfilePage } from "./internal/pages/ProfilePage";
import { SettingsPage } from "./internal/pages/SettingsPage";
import { UsersPage } from "./internal/pages/UsersPage";
import { useAuth } from "./context/AuthContext";

function ManagementShell() {
  const { session, logout } = useAuth();

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  return <InternalAppLayout onLogout={logout} user={session.user as any} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />} path="/">
          <Route element={<HomePage />} index />
          <Route element={<HotelDetailPage />} path="motels/:slug" />
          <Route element={<LoginPage />} path="login" />
          <Route element={<OwnerAccessPage />} path="acceso-hoteles" />
          <Route element={<RegisterPage />} path="register" />
          <Route
            element={
              <Guard roles={["CUSTOMER"]}>
                <MyBookingsPage />
              </Guard>
            }
            path="my-bookings"
          />
          <Route
            element={
              <Guard roles={["HOTEL_ADMIN", "HOTEL_STAFF", "SUPER_ADMIN", "RECEPTION", "CASHIER", "HOUSEKEEPING"]}>
                <ManagementShell />
              </Guard>
            }
            path="management"
          >
            <Route element={<DashboardPage />} index />
            <Route element={<RoomsPage />} path="rooms" />
            <Route element={<RoomReservationPage />} path="rooms/:roomId/reserva" />
            <Route element={<ClientsPage />} path="clients" />
            <Route element={<HistoryPage />} path="history" />
            <Route element={<ProfilePage />} path="profile" />
            <Route element={<SettingsPage />} path="settings" />
            <Route element={<UsersPage />} path="users" />
          </Route>
          <Route element={<Navigate replace to="/" />} path="*" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
