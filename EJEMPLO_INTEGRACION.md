# 📘 Ejemplo de Integración de Supabase

## Antes y Después: admin-puestos-calendario.html

### ❌ ANTES (Datos Estáticos)

```javascript
// Datos hardcodeados
const personalData = [
  { id: 1, name: 'Ana Pérez García', role: 'Farmacéutica Adjunta' },
  { id: 2, name: 'Juan Rodríguez', role: 'Técnico de Farmacia' },
  // ...
];

const puestosData = [
  { id: 'unidosis-manana', name: 'Unidosis - Turno Mañana', color: 'purple' },
  // ...
];
```

### ✅ DESPUÉS (Datos de Supabase)

```javascript
// Variables globales
let personalData = [];
let puestosData = [];
let areasData = [];

// Cargar datos al iniciar
async function init() {
  await loadData();
  setTodayDate();
  loadPersonalSelects();
  loadPuestosSelects();
  renderQuickAssignment();
  renderWeek();
  renderTemplates();
}

// Nueva función para cargar desde Supabase
async function loadData() {
  try {
    // Cargar usuarios
    const usuarios = await supabaseAPI.usuarios.getAll();
    personalData = usuarios.map(u => ({
      id: u.id,
      name: u.nombre,
      role: u.rol
    }));

    // Cargar áreas
    areasData = await supabaseAPI.areas.getAll();

    // Cargar puestos con sus áreas
    const puestos = await supabaseAPI.puestos.getAll();
    puestosData = puestos.map(p => ({
      id: p.id,
      name: `${p.areas.nombre} - ${p.nombre}`,
      color: p.areas.color,
      areaId: p.area_id
    }));

    // Cargar asignaciones existentes
    await loadAsignacionesFromDB();

  } catch (error) {
    console.error('Error cargando datos:', error);
    showNotification('❌ Error conectando con la base de datos', 'error');
  }
}

// Cargar asignaciones de un rango de fechas
async function loadAsignacionesFromDB() {
  // Cargar 30 días hacia adelante y atrás
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 30);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);

  const asignacionesDB = await supabaseAPI.asignaciones.getByDateRange(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  // Convertir a formato local
  assignments = {};
  asignacionesDB.forEach(asig => {
    if (!assignments[asig.fecha]) {
      assignments[asig.fecha] = {};
    }
    assignments[asig.fecha][asig.puesto_id] = asig.usuario_id;
  });
}
```

---

## Actualizar Función de Asignación Rápida

### ❌ ANTES

```javascript
function assignQuick(date, puestoId, personId) {
  if (!assignments[date]) assignments[date] = {};

  if (personId) {
    assignments[date][puestoId] = parseInt(personId);
    showNotification(`✅ Asignación guardada para ${date}`);
  } else {
    delete assignments[date][puestoId];
  }

  renderQuickAssignment();
}
```

### ✅ DESPUÉS

```javascript
async function assignQuick(date, puestoId, personId) {
  try {
    if (personId) {
      // Crear asignación en Supabase
      const result = await supabaseAPI.asignaciones.create({
        usuario_id: personId,
        puesto_id: puestoId,
        fecha: date
      });

      if (result) {
        // Actualizar estado local
        if (!assignments[date]) assignments[date] = {};
        assignments[date][puestoId] = personId;
        showNotification(`✅ Asignación guardada para ${date}`);
      }
    } else {
      // Eliminar asignación
      await supabaseAPI.asignaciones.deleteByDateAndPuesto(date, puestoId);

      // Actualizar estado local
      if (assignments[date]) {
        delete assignments[date][puestoId];
      }
      showNotification(`🔄 Asignación eliminada`);
    }

    renderQuickAssignment();
  } catch (error) {
    console.error('Error en asignación:', error);
    showNotification('❌ Error guardando asignación', 'error');
  }
}
```

---

## Actualizar Asignación a Calendario (Batch)

### ✅ NUEVO

```javascript
async function assignToCalendar() {
  const personId = document.getElementById('cal-person').value;
  const puestoId = document.getElementById('cal-puesto').value;
  const startDate = new Date(document.getElementById('cal-start-date').value);
  const endDate = new Date(document.getElementById('cal-end-date').value);

  if (!personId || !puestoId || !startDate || !endDate) {
    alert('Por favor completa todos los campos');
    return;
  }

  const selectedWeekdays = Array.from(document.querySelectorAll('.weekday-check:checked'))
    .map(cb => parseInt(cb.value));

  // Preparar asignaciones en lote
  const asignaciones = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const shouldAssign = selectedWeekdays.length === 0 ||
                        selectedWeekdays.includes(current.getDay());

    if (shouldAssign) {
      const dateStr = current.toISOString().split('T')[0];
      asignaciones.push({
        usuario_id: personId,
        puesto_id: puestoId,
        fecha: dateStr
      });
    }

    current.setDate(current.getDate() + 1);
  }

  try {
    // Crear todas las asignaciones en una sola llamada
    const result = await supabaseAPI.asignaciones.createBatch(asignaciones);

    if (result) {
      // Actualizar estado local
      result.forEach(asig => {
        if (!assignments[asig.fecha]) assignments[asig.fecha] = {};
        assignments[asig.fecha][asig.puesto_id] = asig.usuario_id;
      });

      renderWeek();
      showNotification(`✅ ${result.length} asignaciones creadas`);
    }
  } catch (error) {
    console.error('Error creando asignaciones:', error);
    showNotification('❌ Error creando asignaciones en lote', 'error');
  }
}
```

---

## Guardar y Aplicar Plantillas

### ✅ GUARDAR PLANTILLA

```javascript
async function saveTemplate() {
  const name = document.getElementById('template-name').value.trim();
  const desc = document.getElementById('template-desc').value.trim();

  if (!name) {
    alert('Ingresa un nombre para la plantilla');
    return;
  }

  // Recopilar datos de la semana actual
  const templateData = {};
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentWeekStart);
    day.setDate(day.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];
    if (assignments[dateStr]) {
      templateData[i] = { ...assignments[dateStr] };
    }
  }

  try {
    // Guardar en Supabase
    const result = await supabaseAPI.plantillas.create({
      nombre: name,
      descripcion: desc,
      configuracion: templateData
    });

    if (result) {
      templates.push({
        id: result.id,
        name: result.nombre,
        description: result.descripcion,
        data: result.configuracion,
        created: result.created_at
      });

      document.getElementById('template-name').value = '';
      document.getElementById('template-desc').value = '';

      renderTemplates();
      showNotification(`✅ Plantilla "${name}" guardada`);
    }
  } catch (error) {
    console.error('Error guardando plantilla:', error);
    showNotification('❌ Error guardando plantilla', 'error');
  }
}
```

### ✅ APLICAR PLANTILLA

```javascript
async function applyTemplate(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  // Preparar asignaciones para la semana actual
  const asignaciones = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(currentWeekStart);
    day.setDate(day.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];

    if (template.data[i]) {
      // Convertir cada asignación del día
      Object.keys(template.data[i]).forEach(puestoId => {
        const usuarioId = template.data[i][puestoId];
        asignaciones.push({
          usuario_id: usuarioId,
          puesto_id: puestoId,
          fecha: dateStr
        });
      });
    }
  }

  try {
    // Crear todas las asignaciones
    const result = await supabaseAPI.asignaciones.createBatch(asignaciones);

    if (result) {
      // Actualizar estado local
      result.forEach(asig => {
        if (!assignments[asig.fecha]) assignments[asig.fecha] = {};
        assignments[asig.fecha][asig.puesto_id] = asig.usuario_id;
      });

      switchTab('calendario');
      renderWeek();
      showNotification(`✅ Plantilla "${template.name}" aplicada (${result.length} asignaciones)`);
    }
  } catch (error) {
    console.error('Error aplicando plantilla:', error);
    showNotification('❌ Error aplicando plantilla', 'error');
  }
}
```

---

## Actualizar HTML para Incluir Scripts

### Al final de `<body>`, ANTES de `<script>`:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Configuración y API -->
<script src="js/supabase-config.js"></script>
<script src="js/supabase-api.js"></script>

<!-- Tu código actual -->
<script>
  // ... tu código aquí
</script>
```

---

## Manejo de Errores Mejorado

```javascript
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'notification';

  if (type === 'error') {
    notification.style.background = '#EF4444'; // Rojo para errores
  } else {
    notification.style.background = '#10B981'; // Verde para éxito
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}
```

---

## Realtime: Actualización Automática (Opcional)

Si quieres que los cambios se reflejen automáticamente en otros navegadores:

```javascript
// Suscribirse a cambios en asignaciones
function subscribeToChanges() {
  supabaseClient
    .channel('asignaciones-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'asignaciones' },
      (payload) => {
        console.log('Cambio detectado:', payload);

        // Recargar asignaciones
        loadAsignacionesFromDB().then(() => {
          renderWeek();
          renderQuickAssignment();
        });
      }
    )
    .subscribe();
}

// Llamar al iniciar
init().then(() => {
  subscribeToChanges();
});
```

---

## Testing Rápido

Abre la consola (F12) y prueba:

```javascript
// Test 1: Cargar usuarios
supabaseAPI.usuarios.getAll().then(data => {
  console.log('Usuarios:', data);
});

// Test 2: Crear asignación
supabaseAPI.asignaciones.create({
  usuario_id: 'uuid-del-usuario',
  puesto_id: 'uuid-del-puesto',
  fecha: '2025-01-10'
}).then(result => {
  console.log('Asignación creada:', result);
});

// Test 3: Cargar asignaciones del día
supabaseAPI.asignaciones.getByDate('2025-01-10').then(data => {
  console.log('Asignaciones del día:', data);
});
```

---

## Checklist de Migración

- [ ] Configurar credenciales en `supabase-config.js`
- [ ] Crear tablas en Supabase (usar SQL del archivo anterior)
- [ ] Incluir scripts de Supabase en HTML
- [ ] Reemplazar `const` con `let` para arrays de datos
- [ ] Crear función `loadData()` async
- [ ] Actualizar `init()` para llamar `loadData()`
- [ ] Convertir funciones de asignación a `async`
- [ ] Añadir llamadas a API en funciones de create/update/delete
- [ ] Probar cada funcionalidad
- [ ] Configurar RLS en Supabase
- [ ] (Opcional) Añadir realtime subscriptions

---

## 🎯 Resultado Final

Con esta integración:

✅ Todos los datos se guardan en tiempo real en Supabase
✅ Múltiples usuarios pueden trabajar simultáneamente
✅ Los datos persisten entre sesiones
✅ Puedes acceder desde cualquier dispositivo
✅ Tienes backup automático de todo
✅ Puedes exportar datos cuando quieras
✅ Row Level Security protege los datos
