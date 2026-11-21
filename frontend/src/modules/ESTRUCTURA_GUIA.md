# Estructura Modular del Frontend

Cada módulo agrupa las vistas y componentes específicos de un área funcional del sistema.

```
src/modules/<nombre-modulo>/
├── components/        # Componentes privados de este módulo (modales, filtros, formularios)
└── pages/             # Pantallas completas asociadas a las rutas del módulo
```

---

## Mapeo de Pantallas por Rol (según `docs/design/design-system.md`)

El frontend está estructurado sobre **4 roles**, identificados mediante el atributo:
```html
<html data-theme="light|dark" data-role="admin|coordinador|tecnico|cliente">
```

| Módulo | Pantallas Figma | Roles que lo Usan | Descripción |
| :--- | :--- | :--- | :--- |
| **`auth/`** | Login, Recuperar contraseña | Todos | Inicio de sesión, manejo de token JWT y redirección por rol. |
| **`dashboard/`** | `A1`, `CO1`, `T1` | `ADMIN`, `COORDINADOR`, `TECNICO` | `A1`: Reportes globales · `CO1`: Dashboard operativo (cola del día) · `T1`: Mi panel (técnico). |
| **`requests/`** | `A2`, `CO2`, `CO3`, `T2-T4`, `C1-C4` | Todos | Flujo completo: Crear solicitud (Cliente), Bandeja y Asignar (Coordinador), Atender (Técnico), Consulta (Admin). |
| **`clients/`** | `A7`, `A8`, `CO6` | `ADMIN`, `COORDINADOR`, `CLIENTE` | Gestión de empresas clientes y sus sedes físicas. |
| **`technicians/`**| `A5`, `CO4`, `CO5` | `ADMIN`, `COORDINADOR`, `TECNICO` | `A5`: CRUD · `CO4`: Carga del equipo (0 a 5 barras) · `CO5`: Consulta de técnicos. |
| **`users/`** | `A4`, `A6` | `ADMIN` | Listado y creación de usuarios internos (Admin / Coordinador). |
| **`catalogs/`** | `A9` | `ADMIN` (CRUD), Todos (Selectores) | Administración de especialidades, categorías, prioridades y parámetros. |
| **`notifications/`**| `A10`, `CO7`, Panel rápido | Todos | Campanita de la barra superior y panel desplegable de notificaciones. |
| **`audit/`** | `A2` (Auditoría) | `ADMIN` | Visualización inalterable de registros de auditoría. |

---

## Componentes Compartidos (Design System)

En `src/shared/components/` se encuentran los componentes compartidos para no duplicar código:
* **`atoms/`**: `Button`, `Badge`, `Field` (Input/Select v2), `PriorityBadge` (barras de prioridad).
* **`layout/`**: `AppLayout`, `Sidebar` (menú lateral por rol), `Topbar` (barra superior con miga de pan y campana).
* **`styles/tokens.css`**: Las 74 variables oficiales de Figma (`--color-accent`, `--space-*`, `--radius-*`).
