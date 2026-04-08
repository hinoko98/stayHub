import { ResourcePage } from "../components/ui/ResourcePage";
import { StatusPill } from "../components/ui/StatusPill";

export function UsersPage() {
  return (
    <ResourcePage
      title="Usuarios"
      description="Gestion de acceso por rol para recepcion, caja, limpieza y administracion."
      endpoint="/users"
      createMode="modal"
      allowDelete
      allowEdit
      fields={[
        { name: "firstName", label: "Nombres", required: true, helpText: "Nombres del usuario interno." },
        { name: "lastName", label: "Apellidos", required: true, helpText: "Apellidos del usuario interno." },
        { name: "document", label: "Documento", required: true, helpText: "Documento del colaborador." },
        { name: "phone", label: "Telefono", helpText: "Telefono del usuario." },
        { name: "email", label: "Correo", type: "email", helpText: "Correo institucional o personal." },
        { name: "username", label: "Usuario", required: true, helpText: "Nombre de acceso al sistema." },
        {
          name: "password",
          label: "Contrasena",
          type: "password",
          requiredOnCreate: true,
          requiredOnEdit: false,
          helpText: "Clave minima de 6 caracteres. En edicion puedes dejarla vacia para conservar la actual.",
        },
        {
          name: "role",
          label: "Rol",
          type: "select",
          required: true,
          defaultValue: "RECEPTION",
          options: [
            { label: "Administrador", value: "ADMIN" },
            { label: "Recepcion", value: "RECEPTION" },
            { label: "Caja", value: "CASHIER" },
            { label: "Limpieza", value: "HOUSEKEEPING" },
          ],
          helpText: "Nivel de acceso del usuario.",
        },
        {
          name: "status",
          label: "Estado",
          type: "select",
          defaultValue: "ACTIVE",
          options: [
            { label: "Activo", value: "ACTIVE" },
            { label: "Inactivo", value: "INACTIVE" },
          ],
        },
      ]}
      columns={[
        { key: "name", label: "Nombre", render: (item: any) => `${item.firstName} ${item.lastName}` },
        { key: "username", label: "Usuario", render: (item: any) => item.username },
        { key: "role", label: "Rol", render: (item: any) => <StatusPill value={item.role} /> },
        { key: "status", label: "Estado", render: (item: any) => <StatusPill value={item.status} /> },
      ]}
    />
  );
}
