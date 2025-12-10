# Sistema de Gestión de Puestos - Farmacia HUNSC Sur

Sistema web para la gestión de empleados, asignaciones, vacaciones y guardias de la Farmacia del Hospital Universitario Nuestra Señora de Candelaria - Sede Sur.

## 📋 Descripción

Esta aplicación permite gestionar de manera eficiente:
- Asignaciones de personal a diferentes áreas y plantas
- Solicitudes de vacaciones y cambios de guardia
- Perfiles de empleados
- Dashboard personalizado con información del día

## 🎨 Paleta de Colores

La paleta de colores está basada en el logo de la Farmacia HUNSC:

- **Púrpura Principal**: `#5A0E6E` - Color principal del logo
- **Púrpura Secundario**: `#7B2D8E` - Variación más clara
- **Oro/Dorado**: `#AF9100` - Color secundario del logo
- **Oro Claro**: `#D4AF37` - Para acentos y detalles

### Colores de Estado
- **Aprobado**: `#5A0E6E` (Púrpura)
- **Pendiente**: `#AF9100` (Oro)
- **Rechazado**: `#993333` (Rojo)

## 📁 Estructura del Proyecto

```
puestos_hunsc/
├── index.html              # Dashboard principal
├── assets/
│   ├── css/
│   │   └── styles.css      # Estilos comunes y paleta de colores
│   └── images/
│       └── logo-farmacia-hunsc.png  # Logo de la farmacia
├── pages/
│   ├── empleados.html      # Gestión de empleados
│   ├── vacaciones.html     # Solicitudes de vacaciones y guardias
│   ├── asignaciones.html   # Asignación de áreas y plantas
│   └── perfil.html         # Perfil de usuario
└── README.md
```

## 🚀 Características

### Dashboard (index.html)
- Vista general del día del usuario
- Asignación actual con detalles de ubicación y horario
- Resumen de próximas guardias y asignaciones
- Navegación rápida a todas las secciones

### Gestión de Empleados
- Lista de todos los empleados
- Búsqueda por nombre
- Vista de detalles de cada empleado
- Botón para añadir nuevo empleado

### Vacaciones y Guardias
- Calendario interactivo para selección de fechas
- Solicitud de vacaciones
- Solicitud de cambio de guardia
- Historial de solicitudes con estados (Aprobado/Pendiente/Rechazado)
- Filtros por tipo de solicitud

### Asignaciones de Áreas
- Gestión de áreas (Unidosis, Farmacotecnia, Nutrición Parenteral, etc.)
- Asignación de personal a áreas específicas
- Indicadores de capacidad por área
- Vista de personal actual y futuro

### Perfil de Usuario
- Información personal del empleado
- Área asignada
- Estadísticas de vacaciones, días libres y asignaciones
- Próximas asignaciones programadas
- Opciones de actualización de preferencias

## 🎨 Diseño y Estética

El diseño implementa:
- **Glassmorphism**: Efectos de cristal translúcido con backdrop blur
- **Bordes Iridiscentes**: Degradados sutiles que siguen la paleta de colores
- **Modo Claro/Oscuro**: Soporte completo para ambos temas
- **Responsive Design**: Optimizado para dispositivos móviles y tablets
- **Animaciones Suaves**: Transiciones y hover effects
- **Material Symbols**: Iconografía moderna de Google

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos avanzados con variables CSS
- **Tailwind CSS**: Framework de utilidades CSS
- **Google Fonts**: Tipografía Inter
- **Material Symbols**: Iconos de Google

## 📱 Compatibilidad

La aplicación está optimizada para:
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móviles (iOS y Android)
- Tablets
- Escritorio

## 🎯 Navegación

La aplicación cuenta con una barra de navegación inferior fija que permite acceder rápidamente a:
- Dashboard
- Calendario/Vacaciones
- Empleados
- Asignaciones
- Perfil

## 🔧 Instalación y Uso

1. Clona el repositorio:
```bash
git clone https://github.com/Eskoool/puestos_hunsc.git
```

2. Abre el archivo `index.html` en tu navegador web preferido.

No se requieren dependencias adicionales ni instalación de paquetes. La aplicación funciona completamente del lado del cliente.

## 📝 Notas de Desarrollo

- Las imágenes de perfil y logos actualmente usan URLs externas. Para producción, se recomienda descargar y alojar localmente todas las imágenes.
- El logo de la farmacia debe ser descargado y colocado en `assets/images/logo-farmacia-hunsc.png`
- La funcionalidad de backend (guardar datos, autenticación, etc.) debe ser implementada según los requisitos del proyecto.

## 🎨 Personalización

Para personalizar los colores, edita las variables CSS en `assets/css/styles.css`:

```css
:root {
  --primary-purple: #5A0E6E;
  --primary-gold: #AF9100;
  --accent-gold: #D4AF37;
  /* ... más variables */
}
```

## 👥 Contribución

Este proyecto es para uso interno de la Farmacia HUNSC Sur. Para contribuir:

1. Crea una rama con tu funcionalidad
2. Realiza tus cambios respetando la paleta de colores y estilo
3. Envía un pull request con descripción detallada

## 📄 Licencia

Uso interno - Farmacia Hospital Universitario Nuestra Señora de Candelaria

## 📧 Contacto

Para preguntas o soporte, contacta con el equipo de desarrollo de la Farmacia HUNSC.

---

**Versión**: 1.0.0
**Última actualización**: Diciembre 2024
**Estado**: En desarrollo
