# Orden Fin

App mobile-first para registrar gastos por categoría, sin enfoque contable. Permite cargar una foto de un recibo/comprobante y usa Claude (visión) para pre-llenar el monto, comercio, fecha y categoría sugerida — siempre confirmables antes de guardar.

- **Backend**: [PocketBase](https://pocketbase.io/) (SQLite + auth + almacenamiento de archivos, un solo binario).
- **Frontend**: Next.js (App Router) + Tailwind CSS, pensado como PWA instalable.
- **Extracción de recibos**: Claude vision vía `@anthropic-ai/sdk`, llamado solo desde el servidor (`/api/extract-receipt`).

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
3. **Frontend**: `cd web && cp .env.example .env.local` (ajusta `ANTHROPIC_API_KEY`), luego `npm install && npm run dev`.
4. Abre `http://localhost:3000`, inicia sesión con el usuario creado en el paso 2.

## Todo junto con Docker Compose

```
cp .env.example .env   # completa ANTHROPIC_API_KEY
docker compose up --build
```

PocketBase queda en `:8090`, la app en `:3000`.

## Deploy en Coolify (VPS propio)

1. Crea un nuevo recurso tipo **Docker Compose** en Coolify apuntando a este repo (usa `docker-compose.yml` de la raíz).
2. Define las variables de entorno del proyecto en Coolify: `NEXT_PUBLIC_PB_URL` (la URL pública que le asignes al servicio `pocketbase`, ej. `https://pb.tudominio.com`) y `ANTHROPIC_API_KEY`.
   - Importante: `NEXT_PUBLIC_PB_URL` se hornea en el build del frontend (es una env var pública de Next.js), así que debe estar disponible **como build arg** al construir `web`, no solo en runtime.
3. Asigna dominios/HTTPS a cada servicio (`pocketbase` y `web`) desde Coolify.
4. Monta un volumen persistente para `pb_data` (ya está declarado en el compose) para que los datos sobrevivan a los redeploys.
5. Tras el primer deploy, entra a `https://pb.tudominio.com/_/`, crea el superusuario admin y el usuario de la app (mismo paso 2 de desarrollo local).

## Notas / próximos pasos

- La versión de PocketBase está fijada en `pocketbase/Dockerfile` (`ARG PB_VERSION`). Revisa [releases](https://github.com/pocketbase/pocketbase/releases) y actualízala si quieres una más reciente.
- Los íconos de `web/public/icons/icon.svg` son un placeholder simple. Para que la app se vea bien instalada en iOS (que requiere PNG, no SVG, para el ícono de home screen), genera un set real de íconos (ej. con [realfavicongenerator.net](https://realfavicongenerator.net)) y reemplázalos antes de compartir la app fuera de tu propio celular.
- El middleware solo verifica que exista la cookie de sesión de PocketBase, no la valida contra el servidor en cada request — suficiente para uso personal, pero no es una barrera de seguridad fuerte si más adelante agregas más usuarios.
- Fuera de alcance por ahora (a propósito): presupuestos, reportes/gráficos, multi-moneda, multi-usuario.
