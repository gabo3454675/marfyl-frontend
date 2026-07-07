# MARFYL Frontend

Aplicación web para la plataforma MARFYL-VF — gestión fiscal y facturación para Venezuela.

## Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, TypeScript, Tailwind CSS
- **Estado:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts
- **Animaciones:** Framer Motion

## Inicio Rápido

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu URL del backend

# Iniciar en desarrollo
pnpm dev
```

La app arranca en `http://localhost:3003`.

## Estructura

```
src/
├── app/              # App Router
│   ├── (auth)/       # Login, registro, recovery
│   ├── (dashboard)/  # Panel principal (21 rutas)
│   └── (marketing)/  # Páginas públicas
├── components/       # Componentes React
│   ├── ui/           # Componentes base (cards, buttons, etc.)
│   ├── admin/        # Componentes del admin
│   ├── dashboard/    # Charts y métricas
│   ├── pos/          # Punto de venta
│   ├── products/     # Variantes de producto (VariantManager, VariantForm, VariantListItem)
│   ├── assistant/    # Asistente IA
│   ├── concert/      # Boletería
│   └── fiscal/       # Módulo fiscal
├── hooks/            # Hooks personalizados
├── lib/              # Utilidades y API clients
├── store/            # Estado global (Zustand)
└── config/           # Navegación
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=MARFYL
```

**NUNCA commitear .env.local al repositorio.**

## Build

```bash
pnpm build    # Build de producción
pnpm start    # Iniciar en producción
```
