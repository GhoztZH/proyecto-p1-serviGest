# 🛠️ ServiGest Ecuador

Plataforma para la gestión de solicitudes de servicio técnico con **4 roles**: Administrador, Coordinador, Técnico y Cliente.

---

## 📁 1. Estructura General

```
proyecto-p1-serviGest/
├── docs/                      # Fuente de la verdad (openapi.yaml, db-serviGest.sql, tokens.css)
├── backend/                   # API REST (Node.js + Express + TypeScript + PostgreSQL)
└── frontend/                  # SPA (React 19 + TypeScript + Vite)
```

### Separación de Módulos y `shared`
* **`shared/` (Transversal)**: Utilidades que todos comparten para no duplicar código.
  * **Frontend**: Cliente Axios (`/api` con token JWT automático), `AuthContext` (sesión y `data-role`), componentes atómicos del Design System y formateadores.
  * **Backend**: Conexión PostgreSQL (`pool`), middleware de errores estándar (`openapi.yaml`), lectura de `.env` y clases de error (`AppError`).
* **`modules/` (Negocio)**: Cada integrante programa dentro de su propia carpeta de módulo de forma aislada:
  * **Backend**: `domain/` (tipos), `application/` (casos de uso), `infrastructure/` (SQL), `presentation/` (rutas Express).
  * **Frontend**: `pages/` (pantallas) y `components/` (componentes del módulo).

---

## 👥 2. División de Trabajo (4 Integrantes)

| Integrante | Módulos Asignados | Backend | Frontend | Roles que Atiende |
| :--- | :--- | :--- | :--- | :--- |
| **👤 Integrante 1** | `auth`, `users` | Login JWT, recuperación de clave, CRUD usuarios y middleware `authenticate` | Pantallas de Login, Mi Perfil, Gestión de Usuarios y `<ProtectedRoute />` | **Todos** (Login/Perfil), **Admin** (Usuarios) |
| **👤 Integrante 2** | `clients`, `technicians`, `catalogs` | CRUD de clientes, sedes, técnicos, disponibilidad y catálogos | Vistas de Clientes, Técnicos, Catálogos y Parámetros | **Admin** (CRUD), **Coordinador** (Consulta), **Técnico** (Disponibilidad) |
| **👤 Integrante 3** | `requests` *(Core)* | Ciclo de vida de solicitudes (estados, SLA, asignación de técnico, evidencias) | Crear solicitud (Cliente), Bandeja/Asignar (Coordinador) y Atender (Técnico) | **Los 4 Roles** *(Flujo principal)* |
| **👤 Integrante 4** | `dashboard`, `notifications`, `audit` | Consultas analíticas (KPIs), endpoints de notificaciones y logs de auditoría | Dashboards con Recharts por rol, campanita de notificaciones y tabla de auditoría | **Admin**, **Coordinador**, **Técnico** |

---

## 🚀 3. Instalación y Arranque Rápido

### Requisitos: Node.js 20+ y PostgreSQL 15+

1. **Base de Datos**:
   * Crear la base `servigest` en PostgreSQL.
   * Ejecutar el script: `docs/database/db-serviGest.sql`.

2. **Backend**:
   ```bash
   cd backend
   npm install
   ```
   *Crear `backend/.env`:*
   ```env
   PORT=3000
   DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/servigest
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=servigest_clave_jwt_2026
   ```
   *Iniciar:*
   ```bash
   npm run dev
   # Corriendo en http://localhost:3000 (verificar salud en /api/health)
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Corriendo en http://localhost:5173
   ```

---

## ⚠️ 4. Reglas de Oro para el Equipo

1. **El contrato es `docs/api/openapi.yaml`**: Respeta los nombres de campos y rutas documentados. Si algo debe cambiar, se acuerda primero en equipo y se actualiza el archivo YAML.
2. **Cero conflictos en Git**: Trabaja siempre en una rama propia (`feature/<tu-modulo>`) y exclusivamente dentro de tus carpetas asignadas en `modules/`.
3. **Colores automáticos**: Usa `var(--color-accent)` en tus componentes; el Design System pinta el color correcto automáticamente según el rol logueado.
4. **Verificación antes de Pull Request**: Ejecuta `npm run typecheck` tanto en `backend/` como en `frontend/` para asegurar cero errores de compilación.
