# Estructura Modular del Backend (Clean Architecture)

Cada módulo representa un dominio del negocio y debe aislar sus responsabilidades en 4 capas concéntricas para evitar acoplamiento:

```
src/modules/<nombre-modulo>/
├── domain/            # 1. Interfaces, tipos y puertos puros (sin Express ni pg)
├── application/       # 2. Casos de uso y servicios de aplicación (orquestación)
├── infrastructure/    # 3. Adaptadores técnicos (repositorios PostgreSQL, JWT, hashing, etc.)
├── presentation/      # 4. Rutas y controladores de Express, validación con Zod
└── index.ts           # 5. Factoría del módulo (ensambla las 4 capas y exporta { routes })
```

---

## Módulos y Roles Asignados (según `docs/api/openapi.yaml`)

| Módulo | Roles con Acceso | Responsabilidades Principales |
| :--- | :--- | :--- |
| **`auth/`** | Todos los roles | Login JWT (`POST /api/auth/login`), logout, cambio y recuperación de contraseña, generación del middleware `authenticate`. |
| **`users/`** | `ADMIN` | CRUD de usuarios internos (Administradores y Coordinadores). |
| **`clients/`** | `ADMIN` (CRUD), `COORDINADOR` (Consulta), `CLIENTE` (Ver su propia sede) | Gestión de razones sociales de clientes empresariales y sus sedes físicas. |
| **`technicians/`**| `ADMIN` (CRUD), `COORDINADOR` (Consulta/Carga), `TECNICO` (Disponibilidad) | Ficha del personal técnico, asignación de especialidades y estado de disponibilidad. |
| **`catalogs/`** | `ADMIN` (CRUD), Todos (Consulta) | Catálogos del sistema: Especialidades, categorías, prioridades (SLA) y parámetros operativos. |
| **`requests/`** | `CLIENTE` (Crear/Mis solicitudes), `COORDINADOR` (Bandeja/Asignar), `TECNICO` (Atender), `ADMIN` (Consulta) | Ciclo de vida de solicitudes de servicio técnico (estados, tiempos, comentarios, adjuntos). |
| **`dashboard/`** | `ADMIN` (Global), `COORDINADOR` (Operativo), `TECNICO` (Mi panel) | Consultas SQL agregadas y métricas de desempeño/SLA por rol. |
| **`notifications/`**| Todos los roles | Emisión y lectura de notificaciones (campanita) asociadas a eventos de solicitudes. |
| **`audit/`** | `ADMIN` | Consulta del registro inalterable de eventos y acciones del sistema. |

---

## Ejemplo de Plantilla de Código para un Módulo

A continuación se muestra el patrón de referencia para implementar cualquier módulo:

### 1. `domain/<modulo>.types.ts`
```ts
// Interfaces puras del negocio
export interface Solicitud {
  id: number;
  codigo: string;
  titulo: string;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'EN_CURSO' | 'FINALIZADA';
}

export interface SolicitudRepository {
  buscarPorId(id: number): Promise<Solicitud | null>;
  guardar(solicitud: Solicitud): Promise<void>;
}
```

### 2. `application/<modulo>.service.ts`
```ts
// Caso de uso: depende únicamente de las interfaces del dominio
import type { SolicitudRepository, Solicitud } from '../domain/<modulo>.types.js';

export class SolicitudService {
  constructor(private readonly repo: SolicitudRepository) {}

  async obtenerDetalle(id: number): Promise<Solicitud> {
    const solicitud = await this.repo.buscarPorId(id);
    if (!solicitud) throw new Error('Solicitud no encontrada');
    return solicitud;
  }
}
```

### 3. `infrastructure/<modulo>.repository.ts`
```ts
// Adaptador de persistencia: implementa la interfaz del dominio usando PostgreSQL
import type { Pool } from 'pg';
import type { SolicitudRepository, Solicitud } from '../domain/<modulo>.types.js';

export class PgSolicitudRepository implements SolicitudRepository {
  constructor(private readonly pool: Pool) {}

  async buscarPorId(id: number): Promise<Solicitud | null> {
    const res = await this.pool.query('SELECT * FROM solicitudes WHERE id = $1', [id]);
    return res.rows[0] ?? null;
  }

  async guardar(solicitud: Solicitud): Promise<void> {
    // Consulta INSERT / UPDATE
  }
}
```

### 4. `presentation/<modulo>.routes.ts`
```ts
// Controlador HTTP con Express
import { Router, type Request, type Response } from 'express';
import type { SolicitudService } from '../application/<modulo>.service.js';

export function createSolicitudRoutes(service: SolicitudService): Router {
  const router = Router();

  router.get('/solicitudes/:id', async (req: Request, res: Response) => {
    try {
      const data = await service.obtenerDetalle(Number(req.params.id));
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: { code: 'NO_ENCONTRADO', message: err.message } });
    }
  });

  return router;
}
```

### 5. `index.ts` (Factoría del Módulo)
```ts
// Punto único de ensamblaje del módulo
import type { Pool } from 'pg';
import type { Router } from 'express';
import { PgSolicitudRepository } from './infrastructure/<modulo>.repository.js';
import { SolicitudService } from './application/<modulo>.service.js';
import { createSolicitudRoutes } from './presentation/<modulo>.routes.js';

export function createSolicitudModule(pool: Pool): { routes: Router; service: SolicitudService } {
  const repo = new PgSolicitudRepository(pool);
  const service = new SolicitudService(repo);
  const routes = createSolicitudRoutes(service);

  return { routes, service };
}
```
