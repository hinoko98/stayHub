import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { createResource, deleteResource, fetchList, updateResource } from "../../services/resources";
import type { ColumnConfig, FieldConfig, ListResponse } from "../../types/types";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

type ResourceItem = Record<string, unknown> & {
  id?: number | string;
};

type ResourcePageProps<T extends ResourceItem> = {
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  columns: ColumnConfig<T>[];
  createMode?: "inline" | "modal";
  allowEdit?: boolean;
  allowDelete?: boolean;
  editFields?: FieldConfig[];
};

const getVisibleFields = (fields: FieldConfig[], mode: "create" | "edit") =>
  fields.filter((field) => !(mode === "edit" && field.hiddenOnEdit));

const isRequired = (field: FieldConfig, mode: "create" | "edit") => {
  if (mode === "create" && field.requiredOnCreate !== undefined) {
    return field.requiredOnCreate;
  }

  if (mode === "edit" && field.requiredOnEdit !== undefined) {
    return field.requiredOnEdit;
  }

  return Boolean(field.required);
};

const buildFormState = (fields: FieldConfig[], source?: Record<string, unknown>) =>
  fields.reduce<Record<string, string | number | boolean>>((acc, field) => {
    const sourceValue = source?.[field.name];

    if (sourceValue !== undefined && sourceValue !== null) {
      acc[field.name] = field.type === "checkbox" ? Boolean(sourceValue) : (sourceValue as string | number | boolean);
      return acc;
    }

    if (field.defaultValue !== undefined) {
      acc[field.name] = field.defaultValue;
      return acc;
    }

    acc[field.name] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});

const normalizePayload = (
  fields: FieldConfig[],
  form: Record<string, string | number | boolean>,
  mode: "create" | "edit",
) =>
  getVisibleFields(fields, mode).reduce<Record<string, string | number | boolean | null>>((acc, field) => {
    const value = form[field.name];
    const required = isRequired(field, mode);

    if (field.type === "checkbox") {
      acc[field.name] = Boolean(value);
      return acc;
    }

    if (value === "" || value === undefined) {
      if (mode === "edit" && field.type === "password") {
        return acc;
      }

      acc[field.name] = required ? "" : null;
      return acc;
    }

    acc[field.name] = field.type === "number" ? Number(value) : (value as string | number | boolean);
    return acc;
  }, {});

export function ResourcePage<T extends ResourceItem>({
  title,
  description,
  endpoint,
  fields,
  columns,
  createMode = "inline",
  allowEdit = false,
  allowDelete = false,
  editFields,
}: ResourcePageProps<T>) {
  const createFields = useMemo(() => getVisibleFields(fields, "create"), [fields]);
  const editableFields = useMemo(() => getVisibleFields(editFields || fields, "edit"), [editFields, fields]);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean>>(buildFormState(createFields));
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number | boolean>>(buildFormState(editableFields));

  const loadItems = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchList<T>(endpoint);
      setItems((data as ListResponse<T>).items || []);
    } catch (err) {
      setError("No fue posible cargar la informacion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [endpoint]);

  useEffect(() => {
    setForm(buildFormState(createFields));
  }, [createFields]);

  useEffect(() => {
    if (editingItem) {
      setEditForm(buildFormState(editableFields, editingItem));
    }
  }, [editableFields, editingItem]);

  const handleChange = (
    setter: Dispatch<SetStateAction<Record<string, string | number | boolean>>>,
    name: string,
    value: string | number | boolean,
  ) => {
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createResource(endpoint, normalizePayload(createFields, form, "create"));
      setSuccess("Registro creado correctamente.");
      setForm(buildFormState(createFields));
      await loadItems();

      if (createMode === "modal") {
        setModalOpen(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "No fue posible guardar el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingItem?.id) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await updateResource(`${endpoint}/${editingItem.id}`, normalizePayload(editableFields, editForm, "edit"));
      setSuccess("Registro actualizado correctamente.");
      setEditingItem(null);
      await loadItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No fue posible actualizar el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: T) => {
    if (!item.id) {
      return;
    }

    if (!window.confirm("Esta accion eliminara el registro. Deseas continuar?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteResource(`${endpoint}/${item.id}`);
      setSuccess("Registro eliminado correctamente.");
      await loadItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No fue posible eliminar el registro.");
    }
  };

  const renderField = (
    field: FieldConfig,
    values: Record<string, string | number | boolean>,
    setter: Dispatch<SetStateAction<Record<string, string | number | boolean>>>,
    mode: "create" | "edit",
  ) => (
    <label key={`${mode}-${field.name}`} className={field.type === "textarea" ? "field field-wide" : "field"}>
      <span>{field.label}</span>
      {field.type === "select" ? (
        <select
          value={String(values[field.name] ?? "")}
          onChange={(event) => handleChange(setter, field.name, event.target.value)}
          required={isRequired(field, mode)}
        >
          <option value="">Selecciona</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          value={String(values[field.name] ?? "")}
          onChange={(event) => handleChange(setter, field.name, event.target.value)}
          placeholder={field.placeholder}
          required={isRequired(field, mode)}
        />
      ) : field.type === "checkbox" ? (
        <input
          checked={Boolean(values[field.name])}
          onChange={(event) => handleChange(setter, field.name, event.target.checked)}
          type="checkbox"
        />
      ) : (
        <input
          type={field.type || "text"}
          value={String(values[field.name] ?? "")}
          onChange={(event) =>
            handleChange(setter, field.name, field.type === "number" ? Number(event.target.value) : event.target.value)
          }
          placeholder={field.placeholder}
          required={isRequired(field, mode)}
        />
      )}
    </label>
  );

  const formContent = (
    <form className="form-grid" onSubmit={handleSubmit}>
      {createFields.map((field) => renderField(field, form, setForm, "create"))}

      <div className="form-actions field-wide">
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? "Guardando..." : `Crear ${title.slice(0, -1)}`}
        </button>
        {success && <span className="form-success">{success}</span>}
        {error && <span className="form-error">{error}</span>}
      </div>
    </form>
  );

  return (
    <div className="page-grid">
      {createMode === "inline" ? (
        <Panel helpText={description} title={title}>
          {formContent}
        </Panel>
      ) : (
        <Panel
          title={title}
          helpText={description}
          actions={
            <button className="primary-button" onClick={() => setModalOpen(true)} type="button">
              Crear {title.slice(0, -1)}
            </button>
          }
        >
          <p className="empty-state">Usa el boton superior para crear un nuevo registro desde un modal.</p>
          {success && <span className="form-success">{success}</span>}
          {error && <span className="form-error">{error}</span>}
        </Panel>
      )}

      <Panel
        title={`Listado de ${title.toLowerCase()}`}
        helpText="Vista operativa rapida para consultar y validar datos clave."
        actions={<StatusPill value={loading ? "Cargando" : `${items.length} registros`} />}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {(allowEdit || allowDelete) && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={String(item.id ?? index)}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(item)}</td>
                  ))}
                  {(allowEdit || allowDelete) && (
                    <td>
                      <div className="table-actions">
                        {allowEdit && item.id ? (
                          <button className="ghost-button table-action-button" onClick={() => setEditingItem(item)} type="button">
                            Editar
                          </button>
                        ) : null}
                        {allowDelete && item.id ? (
                          <button className="ghost-button table-action-button" onClick={() => handleDelete(item)} type="button">
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <p className="empty-state">Todavia no hay registros en este modulo.</p>}
        </div>
      </Panel>

      {createMode === "modal" && modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="modal-header">
              <h2>Crear {title.slice(0, -1)}</h2>
              <button className="ghost-button" onClick={() => setModalOpen(false)} type="button">
                Cerrar
              </button>
            </div>
            {formContent}
          </div>
        </div>
      )}

      {editingItem && (
        <div className="modal-backdrop" onClick={() => setEditingItem(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="modal-header">
              <h2>Editar {title.slice(0, -1)}</h2>
              <button className="ghost-button" onClick={() => setEditingItem(null)} type="button">
                Cerrar
              </button>
            </div>

            <form className="form-grid" onSubmit={handleEditSubmit}>
              {editableFields.map((field) => renderField(field, editForm, setEditForm, "edit"))}

              <div className="form-actions field-wide">
                <button className="primary-button" disabled={submitting} type="submit">
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </button>
                {error && <span className="form-error">{error}</span>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
