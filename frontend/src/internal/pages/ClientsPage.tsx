import { ResourcePage } from "../components/ui/ResourcePage";
import { StatusPill } from "../components/ui/StatusPill";

export function ClientsPage() {
  return (
    <ResourcePage
      title="Clientes"
      description="Responsables principales de la reserva y base del historial comercial."
      endpoint="/clients"
      createMode="modal"
      allowDelete
      allowEdit
      fields={[
        { name: "firstName", label: "Nombres", required: true, helpText: "Nombres del cliente principal." },
        { name: "lastName", label: "Apellidos", required: true, helpText: "Apellidos del cliente principal." },
        {
          name: "documentType",
          label: "Tipo documento",
          type: "select",
          required: true,
          defaultValue: "CC",
          options: [
            { label: "CC", value: "CC" },
            { label: "CE", value: "CE" },
            { label: "TI", value: "TI" },
            { label: "Pasaporte", value: "PASSPORT" },
            { label: "Otro", value: "OTHER" },
          ],
          helpText: "Selecciona el tipo de documento del cliente.",
        },
        { name: "documentNumber", label: "Numero documento", required: true, helpText: "Documento del cliente." },
        { name: "primaryPhone", label: "Telefono principal", required: true, helpText: "Telefono de contacto." },
        { name: "email", label: "Correo", type: "email", helpText: "Correo electronico del cliente." },
        { name: "city", label: "Ciudad", helpText: "Ciudad de origen o residencia." },
        { name: "country", label: "Pais", helpText: "Pais de procedencia del cliente." },
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
        { key: "name", label: "Cliente", render: (item: any) => `${item.firstName} ${item.lastName}` },
        { key: "document", label: "Documento", render: (item: any) => item.documentNumber },
        { key: "phone", label: "Telefono", render: (item: any) => item.primaryPhone },
        { key: "status", label: "Estado", render: (item: any) => <StatusPill value={item.status} /> },
      ]}
    />
  );
}
