# Orden Fin

App mobile-first para registrar gastos por categoría, sin enfoque contable. Permite cargar una foto de un recibo/comprobante y usa un modelo con visión (vía OpenRouter) para pre-llenar el monto, comercio, fecha y categoría sugerida — siempre confirmables antes de guardar.

- **Backend**: [PocketBase](https://pocketbase.io/) (SQLite + auth + almacenamiento de archivos, un solo binario).
- **Frontend**: Next.js (App Router) + Tailwind CSS, pensado como PWA instalable.
- **Extracción de recibos**: modelo con visión vía [OpenRouter](https://openrouter.ai/) (SDK `openai` apuntando a su API), llamado solo desde el servidor (`/api/extract-receipt`). El modelo se elige por env var (`OPENROUTER_MODEL`), así que se puede cambiar o complementar sin tocar código.

## Estructura

```
pocketbase/       Dockerfile + migraciones (schema versionado como código)
web/               App Next.js
docker-compose.yml Levanta ambos servicios juntos
```

## Desarrollo local

1. **Backend**: `cd pocketbase && docker build -t orden-fin-pb . && docker run -p 8090:8090 -v pb_data:/pb/pb_data orden-fin-pb`
   Las migraciones crean las colecciones `categories` (con 8 categorías precargadas) y `expenses` automáticamente al primer arranque.
2. Entra a `http://localhost:8090/_/`, crea el **superusuario admin** de PocketBase, y luego crea **un registro en la colección `users`** (ese es el usuario con el que inicias sesión en la app — distinto del superusuario admin).
3. **Frontend**: `cd web && cp .env.example .env.local` (ajusta `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`), luego `npm install && npm run dev`.
4. Abre `http://localhost:3000`, inicia sesión con el usuario creado en el paso 2.

## Todo junto con Docker Compose

```
cp .env.example .env   # completa OPENROUTER_API_KEY y OPENROUTER_MODEL
docker compose up --build
```

PocketBase queda en `:8090`, la app en `:3000`.

## Deploy en Coolify (VPS propio)

1. Crea un nuevo recurso tipo **Docker Compose** en Coolify apuntando a este repo (usa `docker-compose.yml` de la raíz).
2. Define las variables de entorno del proyecto en Coolify: `NEXT_PUBLIC_PB_URL` (la URL pública que le asignes al servicio `pocketbase`, ej. `https://pb.tudominio.com`), `OPENROUTER_API_KEY`/`OPENROUTER_MODEL`, y `PB_APP_EMAIL`/`PB_APP_PASSWORD` (credenciales del usuario de la app, usadas server-side por `/api/mcp` — ver más abajo).
   - Importante: `NEXT_PUBLIC_PB_URL` se hornea en el build del frontend (es una env var pública de Next.js), así que debe estar disponible **como build arg** al construir `web`, no solo en runtime.
3. Asigna dominios/HTTPS a cada servicio (`pocketbase` y `web`) desde Coolify.
4. Monta un volumen persistente para `pb_data` (ya está declarado en el compose) para que los datos sobrevivan a los redeploys.
5. Tras el primer deploy, entra a `https://pb.tudominio.com/_/`, crea el superusuario admin y el usuario de la app (mismo paso 2 de desarrollo local).

### Corriendo varios entornos (staging + producción) en el mismo VPS

El volumen de datos usa el nombre `${PB_DATA_VOLUME:-orden_fin_pb_data}` en vez de dejar que Coolify lo nombre solo — así se evita que dos recursos de Coolify (uno por rama) terminen compartiendo o pisando el mismo volumen de PocketBase por accidente. Si vas a tener staging y producción en el mismo servidor:

- En el recurso de **producción**, define la env var `PB_DATA_VOLUME=orden_fin_pb_data_prod`.
- En el recurso de **staging**, define `PB_DATA_VOLUME=orden_fin_pb_data_staging`.

Con eso cada entorno crea y usa su propio volumen Docker, sin importar cómo Coolify nombre el proyecto internamente. Verifica en `docker volume ls` (por SSH al VPS) que efectivamente aparezcan como dos volúmenes distintos antes de meter datos reales en staging.

## MCP: conectar un agente externo (ej. Hermes)

La app expone un servidor [MCP](https://modelcontextprotocol.io/) de **solo lectura** en `/api/mcp` (transporte Streamable HTTP), para que un agente en otro servidor —como [Hermes](https://hermes-agent.nousresearch.com/)— pueda consultar tus gastos sin nunca poder escribir/borrar nada.

1. Inicia sesión en la app y entra a **Ajustes** (ícono ⚙️ en el header) → `/ajustes`.
2. Ponle un nombre a la clave (ej. "Hermes VPS") y genera una API key. El token completo (`of_...`) se muestra **una sola vez** — cópialo ahí mismo, PocketBase solo guarda su hash.
3. Configura tu agente MCP para apuntar a `https://tu-dominio.com/api/mcp` con `Authorization: Bearer <token>`. Ejemplo de config de Hermes:
   ```yaml
   mcp_servers:
     orden_fin:
       url: "https://tu-dominio.com/api/mcp"
       headers:
         Authorization: "Bearer of_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```
4. Si una clave se filtra o ya no la usas, revócala desde `/ajustes` — el endpoint la rechaza al siguiente request, sin redeploy.

Tools disponibles: `list_expenses` (filtra por fecha/categoría/etiqueta), `get_summary` (totales agrupados por categoría o etiqueta), `list_categories`, `list_tags`, `list_subscriptions`. No hay tools de escritura — mantiene el principio del proyecto de que el usuario siempre confirma antes de guardar.

Requiere las env vars `PB_APP_EMAIL`/`PB_APP_PASSWORD` (ver arriba) — el servidor las usa para autenticarse como el usuario de la app y así validar claves y consultar datos.

## Notas / próximos pasos

- La versión de PocketBase está fijada en `pocketbase/Dockerfile` (`ARG PB_VERSION`). Revisa [releases](https://github.com/pocketbase/pocketbase/releases) y actualízala si quieres una más reciente.
- Los íconos de `web/public/icons/icon.svg` son un placeholder simple. Para que la app se vea bien instalada en iOS (que requiere PNG, no SVG, para el ícono de home screen), genera un set real de íconos (ej. con [realfavicongenerator.net](https://realfavicongenerator.net)) y reemplázalos antes de compartir la app fuera de tu propio celular.
- El middleware solo verifica que exista la cookie de sesión de PocketBase, no la valida contra el servidor en cada request — suficiente para uso personal, pero no es una barrera de seguridad fuerte si más adelante agregas más usuarios.
- Fuera de alcance por ahora (a propósito): presupuestos, reportes/gráficos, multi-moneda, multi-usuario.

## Changelog

Resumen de mejoras mayores por período (no exhaustivo — ver `git log` para el detalle completo).

### 2026-07-09 — Lanzamiento inicial
- Registro de gastos por categoría con extracción automática de recibos (monto, comercio, fecha, categoría sugerida) vía Claude vision, siempre confirmable antes de guardar.
- Flujo de edición y borrado de gastos.
- Deploy parametrizado para correr staging y producción como recursos separados en el mismo VPS (puertos y volumen de datos independientes).

### 2026-07-10 — Tags y resumen
- Sistema de tags: crear, asignar a gastos y filtrar el listado por tag.
- Desglose de gasto por tag en la página de resumen.

### 2026-07-12 — Fix de captura de recibos en mobile
- Se removió `capture="environment"` del input de subida de recibos: en mobile forzaba abrir la cámara directo y ocultaba la opción de elegir desde la galería (en desktop el atributo se ignora, por eso el bug no era visible ahí). Ahora el selector nativo de archivos se comporta igual en todas las plataformas.

### 2026-07-12 — Servidor MCP + API keys autogestionadas
- Endpoint `/api/mcp` (solo lectura) para que agentes externos (ej. Hermes) consulten gastos, categorías y etiquetas vía Streamable HTTP.
- Página `/ajustes` para generar, listar y revocar las API keys que autentican esas conexiones, sin necesidad de tocar el servidor — rotar una clave filtrada toma un click.

### 2026-07-21 — Extracción de recibos migrada a OpenRouter
- Reemplazado `@anthropic-ai/sdk` por el SDK `openai` apuntando a OpenRouter (`OPENROUTER_API_KEY` + `OPENROUTER_MODEL`), para poder cambiar o complementar el modelo de visión sin tocar código.

### 2026-07-21 — Suscripciones centralizadas
- Nueva colección `subscriptions` (dueño, monto, frecuencia de cobro, próxima renovación, estado) con relación opcional desde `expenses`, para vincular un gasto puntual a la suscripción que lo originó.
- Sección `/suscripciones`: listado con total mensual estimado, alerta de renovaciones dentro de 7 días, alta/edición/borrado, y botón "Marcar como renovada" que avanza la fecha según el ciclo de cobro.
- El formulario de gasto ahora permite (opcionalmente) asociar el gasto a una suscripción existente.
- Nueva tool de MCP `list_subscriptions` para que agentes externos también puedan consultarlas.
- Atajo "Convertir en suscripción" desde el detalle de un gasto ya registrado: pre-llena nombre/monto/próxima renovación y vincula el gasto automáticamente al guardar, sin pasar por crear-la-suscripción-y-luego-editar-el-gasto.
