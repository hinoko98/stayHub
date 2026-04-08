import { useEffect, useMemo, useState } from "react";
import { createResource, deleteResource, fetchList, updateResource } from "../services/resources";
import { Panel } from "../components/ui/Panel";
import { StatusPill } from "../components/ui/StatusPill";

const SETTINGS_KEY = "hotelflow_settings";
const FLOOR_KEY = "hotelflow_floors";
const CATEGORY_KEY = "hotelflow_categories";

type RoomRecord = {
  id: number;
  number: string;
  floor: number | null;
  type: string;
  bedCount: number;
  bedType: string | null;
  maxCapacity: number;
  basePrice: number;
  generalStatus: string;
};

type FloorConfig = {
  number: number;
  label: string;
};

type CategoryConfig = {
  id: string;
  name: string;
  bedType: string;
  bedCount: number;
  maxCapacity: number;
  basePrice: number;
};

const defaultSettings = {
  hotelName: "Mi Hotel",
  city: "Bogota",
  checkInHour: "15:00",
  checkOutHour: "12:00",
  taxPercent: "19",
  currency: "COP",
  reservationPrefix: "RES",
};

const defaultFloors: FloorConfig[] = [
  { number: 1, label: "Piso 1" },
  { number: 2, label: "Piso 2" },
  { number: 3, label: "Piso 3" },
];

const defaultCategories: CategoryConfig[] = [
  { id: "individual", name: "Individual", bedType: "1 cama sencilla", bedCount: 1, maxCapacity: 1, basePrice: 95000 },
  { id: "doble", name: "Doble", bedType: "1 cama doble", bedCount: 1, maxCapacity: 2, basePrice: 155000 },
  { id: "twin", name: "Doble Twin", bedType: "2 camas sencillas", bedCount: 2, maxCapacity: 2, basePrice: 145000 },
  { id: "triple", name: "Triple", bedType: "3 camas sencillas", bedCount: 3, maxCapacity: 3, basePrice: 185000 },
  { id: "suite", name: "Suite", bedType: "1 cama king + sofa cama", bedCount: 2, maxCapacity: 3, basePrice: 260000 },
];

const buildRoomNumber = (floor: number, sequence: number) => `${floor}${String(sequence).padStart(2, "0")}`;
const slugify = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "-");

const createQuickDistribution = (floors: FloorConfig[], categories: CategoryConfig[]) => {
  const pattern = ["individual", "twin", "doble", "triple", "doble", "individual", "suite", "triple"];

  return floors.flatMap((floor) =>
    pattern.map((categoryId, index) => {
      const category = categories.find((item) => item.id === categoryId) || categories[0];
      return {
        number: buildRoomNumber(floor.number, index + 1),
        reference: `${floor.label} - ${category.name}`,
        type: category.name,
        floor: floor.number,
        bedCount: category.bedCount,
        bedType: category.bedType,
        maxCapacity: category.maxCapacity,
        basePrice: category.basePrice,
      };
    }),
  );
};

export function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [floors, setFloors] = useState<FloorConfig[]>(defaultFloors);
  const [categories, setCategories] = useState<CategoryConfig[]>(defaultCategories);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newFloor, setNewFloor] = useState({ number: "", label: "" });
  const [editingFloor, setEditingFloor] = useState<FloorConfig | null>(null);
  const [floorForm, setFloorForm] = useState({ number: "", label: "" });
  const [newCategory, setNewCategory] = useState({
    name: "",
    bedType: "",
    bedCount: "1",
    maxCapacity: "1",
    basePrice: "0",
  });
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    bedType: "",
    bedCount: "1",
    maxCapacity: "1",
    basePrice: "0",
  });
  const [newRoom, setNewRoom] = useState({
    floor: "1",
    sequence: "1",
    categoryId: defaultCategories[0].id,
    reference: "",
  });

  const loadRooms = async () => {
    const response = await fetchList<RoomRecord>("/rooms?limit=100");
    setRooms(response.items || []);
  };

  const persistFloors = (items: FloorConfig[]) => {
    setFloors(items);
    localStorage.setItem(FLOOR_KEY, JSON.stringify(items));
  };

  const persistCategories = (items: CategoryConfig[]) => {
    setCategories(items);
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(items));
  };

  useEffect(() => {
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    const rawFloors = localStorage.getItem(FLOOR_KEY);
    const rawCategories = localStorage.getItem(CATEGORY_KEY);

    if (rawSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(rawSettings) });
    }

    if (rawFloors) {
      setFloors(JSON.parse(rawFloors));
    }

    if (rawCategories) {
      setCategories(JSON.parse(rawCategories));
    }

    loadRooms().catch(() => undefined);
  }, []);

  const sortedFloors = useMemo(() => [...floors].sort((a, b) => a.number - b.number), [floors]);
  const selectedCategory = categories.find((category) => category.id === newRoom.categoryId) || categories[0];
  const totalRooms = rooms.length;
  const totalFloors = sortedFloors.length;
  const totalCategories = categories.length;

  useEffect(() => {
    if (sortedFloors.length > 0 && !sortedFloors.some((floor) => String(floor.number) === newRoom.floor)) {
      setNewRoom((current) => ({ ...current, floor: String(sortedFloors[0].number) }));
    }
  }, [newRoom.floor, sortedFloors]);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((category) => category.id === newRoom.categoryId)) {
      setNewRoom((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, newRoom.categoryId]);

  const handleSaveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(FLOOR_KEY, JSON.stringify(floors));
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddFloor = () => {
    const floorNumber = Number(newFloor.number);

    if (!floorNumber || floors.some((floor) => floor.number === floorNumber)) {
      setMessage({ type: "error", text: "La numeracion del piso ya existe o no es valida." });
      return;
    }

    const updatedFloors = [...floors, { number: floorNumber, label: newFloor.label.trim() || `Piso ${floorNumber}` }];
    persistFloors(updatedFloors);
    setNewFloor({ number: "", label: "" });
    setMessage({ type: "success", text: "Piso agregado correctamente." });
  };

  const openFloorEditor = (floor: FloorConfig) => {
    setEditingFloor(floor);
    setFloorForm({ number: String(floor.number), label: floor.label });
  };

  const handleUpdateFloor = () => {
    if (!editingFloor) {
      return;
    }

    const floorNumber = Number(floorForm.number);
    const floorHasRooms = rooms.some((room) => room.floor === editingFloor.number);

    if (!floorNumber) {
      setMessage({ type: "error", text: "La numeracion del piso no es valida." });
      return;
    }

    if (floorNumber !== editingFloor.number && floorHasRooms) {
      setMessage({ type: "error", text: "No puedes cambiar la numeracion de un piso que ya tiene habitaciones." });
      return;
    }

    if (floors.some((floor) => floor.number === floorNumber && floor.number !== editingFloor.number)) {
      setMessage({ type: "error", text: "Ya existe otro piso con esa numeracion." });
      return;
    }

    const updatedFloors = floors.map((floor) =>
      floor.number === editingFloor.number
        ? { number: floorNumber, label: floorForm.label.trim() || `Piso ${floorNumber}` }
        : floor,
    );

    persistFloors(updatedFloors);
    setEditingFloor(null);
    setMessage({ type: "success", text: "Piso actualizado correctamente." });
  };

  const handleDeleteFloor = (floor: FloorConfig) => {
    if (rooms.some((room) => room.floor === floor.number)) {
      setMessage({ type: "error", text: "No puedes eliminar un piso que ya tiene habitaciones registradas." });
      return;
    }

    const updatedFloors = floors.filter((item) => item.number !== floor.number);
    persistFloors(updatedFloors);
    setMessage({ type: "success", text: "Piso eliminado correctamente." });
  };

  const handleAddCategory = () => {
    const categoryName = newCategory.name.trim();
    const categoryId = slugify(categoryName);

    if (!categoryName || !newCategory.bedType.trim()) {
      setMessage({ type: "error", text: "Completa nombre y tipo de cama para la categoria." });
      return;
    }

    if (categories.some((category) => category.id === categoryId)) {
      setMessage({ type: "error", text: "Ya existe una categoria con ese nombre." });
      return;
    }

    const category: CategoryConfig = {
      id: categoryId,
      name: categoryName,
      bedType: newCategory.bedType.trim(),
      bedCount: Number(newCategory.bedCount),
      maxCapacity: Number(newCategory.maxCapacity),
      basePrice: Number(newCategory.basePrice),
    };

    persistCategories([...categories, category]);
    setNewCategory({ name: "", bedType: "", bedCount: "1", maxCapacity: "1", basePrice: "0" });
    setMessage({ type: "success", text: "Categoria agregada correctamente." });
  };

  const openCategoryEditor = (category: CategoryConfig) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      bedType: category.bedType,
      bedCount: String(category.bedCount),
      maxCapacity: String(category.maxCapacity),
      basePrice: String(category.basePrice),
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      return;
    }

    const categoryName = categoryForm.name.trim();
    const categoryId = slugify(categoryName);

    if (!categoryName || !categoryForm.bedType.trim()) {
      setMessage({ type: "error", text: "Completa nombre y tipo de cama para la categoria." });
      return;
    }

    if (categories.some((category) => category.id === categoryId && category.id !== editingCategory.id)) {
      setMessage({ type: "error", text: "Ya existe una categoria con ese nombre." });
      return;
    }

    const updatedCategory: CategoryConfig = {
      id: categoryId,
      name: categoryName,
      bedType: categoryForm.bedType.trim(),
      bedCount: Number(categoryForm.bedCount),
      maxCapacity: Number(categoryForm.maxCapacity),
      basePrice: Number(categoryForm.basePrice),
    };

    try {
      const impactedRooms = rooms.filter((room) => room.type === editingCategory.name);

      for (const room of impactedRooms) {
        await updateResource(`/rooms/${room.id}`, {
          type: updatedCategory.name,
          bedType: updatedCategory.bedType,
          bedCount: updatedCategory.bedCount,
          maxCapacity: updatedCategory.maxCapacity,
          basePrice: updatedCategory.basePrice,
        });
      }

      const updatedCategories = categories.map((category) =>
        category.id === editingCategory.id ? updatedCategory : category,
      );

      persistCategories(updatedCategories);
      setEditingCategory(null);
      await loadRooms();
      setMessage({ type: "success", text: "Categoria actualizada correctamente." });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "No fue posible actualizar la categoria.",
      });
    }
  };

  const handleDeleteCategory = (category: CategoryConfig) => {
    if (rooms.some((room) => room.type === category.name)) {
      setMessage({ type: "error", text: "No puedes eliminar una categoria que ya esta asignada a habitaciones." });
      return;
    }

    const updatedCategories = categories.filter((item) => item.id !== category.id);
    persistCategories(updatedCategories);
    setMessage({ type: "success", text: "Categoria eliminada correctamente." });
  };

  const handleCreateRoom = async () => {
    if (!selectedCategory) {
      setMessage({ type: "error", text: "Selecciona una categoria valida para la habitacion." });
      return;
    }

    const floor = Number(newRoom.floor);
    const sequence = Number(newRoom.sequence);
    const number = buildRoomNumber(floor, sequence);

    try {
      await createResource<{ id: number }, Record<string, unknown>>("/rooms", {
        number,
        reference: newRoom.reference || `Piso ${floor} - ${selectedCategory.name}`,
        type: selectedCategory.name,
        maxCapacity: selectedCategory.maxCapacity,
        bedCount: selectedCategory.bedCount,
        bedType: selectedCategory.bedType,
        floor,
        basePrice: selectedCategory.basePrice,
        generalStatus: "AVAILABLE",
      });

      await loadRooms();
      setMessage({ type: "success", text: `Habitacion ${number} creada correctamente.` });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "No fue posible crear la habitacion.",
      });
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await deleteResource(`/rooms/${roomId}`);
      await loadRooms();
      setMessage({ type: "success", text: "Habitacion eliminada correctamente." });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "No fue posible eliminar la habitacion.",
      });
    }
  };

  const handleGenerateBaseInventory = async () => {
    const template = createQuickDistribution(sortedFloors, categories);
    const currentRoomNumbers = new Set(rooms.map((room) => room.number));

    try {
      for (const room of template) {
        if (currentRoomNumbers.has(room.number)) {
          continue;
        }

        await createResource<{ id: number }, Record<string, unknown>>("/rooms", {
          ...room,
          generalStatus: "AVAILABLE",
        });
      }

      await loadRooms();
      setMessage({ type: "success", text: "Se genero el inventario base de habitaciones." });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "No fue posible generar el inventario base.",
      });
    }
  };

  return (
    <div className="page-grid">
      <Panel
        title="Configuracion del hotel"
        helpText="Parametros operativos para personalizar la recepcion, horarios, pisos, categorias e inventario."
      >
        <div className="settings-overview-grid">
          <article className="settings-overview-card">
            <span>Pisos activos</span>
            <strong>{totalFloors}</strong>
          </article>
          <article className="settings-overview-card">
            <span>Categorias</span>
            <strong>{totalCategories}</strong>
          </article>
          <article className="settings-overview-card">
            <span>Habitaciones</span>
            <strong>{totalRooms}</strong>
          </article>
        </div>

        <div className="form-grid settings-form-grid">
          <label className="field">
            <span>Nombre del hotel</span>
            <input value={settings.hotelName} onChange={(event) => setSettings((current) => ({ ...current, hotelName: event.target.value }))} />
          </label>
          <label className="field">
            <span>Ciudad</span>
            <input value={settings.city} onChange={(event) => setSettings((current) => ({ ...current, city: event.target.value }))} />
          </label>
          <label className="field">
            <span>Hora check-in</span>
            <input value={settings.checkInHour} onChange={(event) => setSettings((current) => ({ ...current, checkInHour: event.target.value }))} />
          </label>
          <label className="field">
            <span>Hora check-out</span>
            <input value={settings.checkOutHour} onChange={(event) => setSettings((current) => ({ ...current, checkOutHour: event.target.value }))} />
          </label>
          <label className="field">
            <span>Impuesto (%)</span>
            <input value={settings.taxPercent} onChange={(event) => setSettings((current) => ({ ...current, taxPercent: event.target.value }))} />
          </label>
          <label className="field">
            <span>Moneda</span>
            <input value={settings.currency} onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))} />
          </label>
        </div>

        <div className="form-actions settings-actions">
          <button className="primary-button" onClick={handleSaveSettings} type="button">
            Guardar
          </button>
          <button className="ghost-button" onClick={handleGenerateBaseInventory} type="button">
            Generar 3 pisos x 8 habitaciones
          </button>
          {saved && <span className="form-success">Configuracion general guardada.</span>}
          {message && <span className={message.type === "success" ? "form-success" : "form-error"}>{message.text}</span>}
        </div>
      </Panel>

      <div className="settings-grid">
        <Panel
          title="Pisos"
          helpText="Lo mas practico es usar numeracion obligatoria y nombre opcional. Si no escribes nombre, el sistema crea uno como Piso 1."
        >
          <div className="form-grid settings-compact-grid">
            <label className="field">
              <span>Numeracion del piso</span>
              <input placeholder="1" type="number" value={newFloor.number} onChange={(event) => setNewFloor((current) => ({ ...current, number: event.target.value }))} />
            </label>
            <label className="field">
              <span>Nombre</span>
              <input placeholder="Piso 1" value={newFloor.label} onChange={(event) => setNewFloor((current) => ({ ...current, label: event.target.value }))} />
            </label>
          </div>

          <div className="form-actions settings-actions">
            <button className="primary-button" onClick={handleAddFloor} type="button">
              Crear piso
            </button>
          </div>

          <div className="settings-list">
            {sortedFloors.map((floor) => (
              <div className="settings-list-item" key={floor.number}>
                <div>
                  <strong>{floor.label}</strong>
                  <span>
                    Piso {floor.number} · Habitaciones {buildRoomNumber(floor.number, 1)} al {buildRoomNumber(floor.number, 8)}
                  </span>
                </div>
                <div className="settings-item-actions">
                  <button className="ghost-button table-action-button" onClick={() => openFloorEditor(floor)} type="button">
                    Editar
                  </button>
                  <button className="ghost-button table-action-button" onClick={() => handleDeleteFloor(floor)} type="button">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Categorias"
          helpText="Las categorias sirven como plantilla para nuevas habitaciones. Si editas una ya usada, se actualizan las habitaciones vinculadas."
        >
          <div className="form-grid settings-compact-grid">
            <label className="field">
              <span>Nombre</span>
              <input value={newCategory.name} onChange={(event) => setNewCategory((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="field">
              <span>Tipo de cama</span>
              <input value={newCategory.bedType} onChange={(event) => setNewCategory((current) => ({ ...current, bedType: event.target.value }))} />
            </label>
            <label className="field">
              <span>Cantidad de camas</span>
              <input type="number" value={newCategory.bedCount} onChange={(event) => setNewCategory((current) => ({ ...current, bedCount: event.target.value }))} />
            </label>
            <label className="field">
              <span>Capacidad</span>
              <input type="number" value={newCategory.maxCapacity} onChange={(event) => setNewCategory((current) => ({ ...current, maxCapacity: event.target.value }))} />
            </label>
            <label className="field">
              <span>Precio base</span>
              <input type="number" value={newCategory.basePrice} onChange={(event) => setNewCategory((current) => ({ ...current, basePrice: event.target.value }))} />
            </label>
          </div>

          <div className="form-actions settings-actions">
            <button className="primary-button" onClick={handleAddCategory} type="button">
              Crear categoria
            </button>
          </div>

          <div className="settings-list">
            {categories.map((category) => (
              <div className="settings-list-item" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.bedType}</span>
                </div>
                <div className="settings-list-item-meta">
                  <span>
                    {category.maxCapacity} huespedes · {category.basePrice}
                  </span>
                  <div className="settings-item-actions">
                    <button className="ghost-button table-action-button" onClick={() => openCategoryEditor(category)} type="button">
                      Editar
                    </button>
                    <button className="ghost-button table-action-button" onClick={() => handleDeleteCategory(category)} type="button">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Crear habitacion" helpText="Genera habitaciones numeradas por piso usando las categorias definidas.">
        <div className="form-grid settings-compact-grid">
          <label className="field">
            <span>Piso</span>
            <select value={newRoom.floor} onChange={(event) => setNewRoom((current) => ({ ...current, floor: event.target.value }))}>
              {sortedFloors.map((floor) => (
                <option key={floor.number} value={String(floor.number)}>
                  {floor.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Secuencia</span>
            <input type="number" value={newRoom.sequence} onChange={(event) => setNewRoom((current) => ({ ...current, sequence: event.target.value }))} />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select value={newRoom.categoryId} onChange={(event) => setNewRoom((current) => ({ ...current, categoryId: event.target.value }))}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Numero generado</span>
            <input disabled value={buildRoomNumber(Number(newRoom.floor), Number(newRoom.sequence))} />
          </label>
          <label className="field field-wide">
            <span>Referencia</span>
            <input value={newRoom.reference} onChange={(event) => setNewRoom((current) => ({ ...current, reference: event.target.value }))} />
          </label>
        </div>

        <div className="form-actions settings-actions">
          <button className="primary-button" onClick={handleCreateRoom} type="button">
            Crear habitacion
          </button>
        </div>
      </Panel>

      <Panel title="Habitaciones registradas" helpText="Listado actual del inventario creado desde la base de datos.">
        <div className="settings-room-list">
          {rooms.map((room) => (
            <article className="settings-room-card" key={room.id}>
              <div className="history-card-top">
                <div>
                  <strong>{room.number}</strong>
                  <p>
                    Piso {room.floor || "N/A"} - {room.type}
                  </p>
                </div>
                <StatusPill value={room.generalStatus} />
              </div>

              <div className="history-grid">
                <div>
                  <span>Tipo de cama</span>
                  <strong>{room.bedType || `${room.bedCount} camas`}</strong>
                </div>
                <div>
                  <span>Capacidad</span>
                  <strong>{room.maxCapacity} huespedes</strong>
                </div>
                <div>
                  <span>Precio base</span>
                  <strong>{room.basePrice}</strong>
                </div>
              </div>

              <div className="form-actions settings-actions">
                <button className="ghost-button" onClick={() => handleDeleteRoom(room.id)} type="button">
                  Eliminar
                </button>
              </div>
            </article>
          ))}

          {rooms.length === 0 && <p className="empty-state">No hay habitaciones registradas todavia.</p>}
        </div>
      </Panel>

      {editingFloor && (
        <div className="modal-backdrop" onClick={() => setEditingFloor(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="modal-header">
              <h2>Editar piso</h2>
              <button className="ghost-button" onClick={() => setEditingFloor(null)} type="button">
                Cerrar
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Numeracion del piso</span>
                <input type="number" value={floorForm.number} onChange={(event) => setFloorForm((current) => ({ ...current, number: event.target.value }))} />
              </label>
              <label className="field">
                <span>Nombre visible</span>
                <input value={floorForm.label} onChange={(event) => setFloorForm((current) => ({ ...current, label: event.target.value }))} />
              </label>
            </div>

            <div className="form-actions settings-actions">
              <button className="primary-button" onClick={handleUpdateFloor} type="button">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="modal-backdrop" onClick={() => setEditingCategory(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="modal-header">
              <h2>Editar categoria</h2>
              <button className="ghost-button" onClick={() => setEditingCategory(null)} type="button">
                Cerrar
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Nombre</span>
                <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="field">
                <span>Tipo de cama</span>
                <input value={categoryForm.bedType} onChange={(event) => setCategoryForm((current) => ({ ...current, bedType: event.target.value }))} />
              </label>
              <label className="field">
                <span>Cantidad de camas</span>
                <input type="number" value={categoryForm.bedCount} onChange={(event) => setCategoryForm((current) => ({ ...current, bedCount: event.target.value }))} />
              </label>
              <label className="field">
                <span>Capacidad</span>
                <input type="number" value={categoryForm.maxCapacity} onChange={(event) => setCategoryForm((current) => ({ ...current, maxCapacity: event.target.value }))} />
              </label>
              <label className="field">
                <span>Precio base</span>
                <input type="number" value={categoryForm.basePrice} onChange={(event) => setCategoryForm((current) => ({ ...current, basePrice: event.target.value }))} />
              </label>
            </div>

            <div className="form-actions settings-actions">
              <button className="primary-button" onClick={handleUpdateCategory} type="button">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
