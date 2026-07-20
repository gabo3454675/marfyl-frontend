# Dashboard (`/`) — Professional Dense + Dark Mode OLED

> **Override del Master MARFYL.**
> Las reglas de este archivo prevalecen sobre `design-system/marfyl-blue-horizon/MASTER.md`
> y `design-system/marfyl/MASTER.md` para la página de dashboard.

---

## 1. Dirección Visual

| Propiedad | Valor | Tokens |
|-----------|-------|--------|
| Estilo | Professional Dense + Dark Mode OLED | — |
| Background | `#0A0E17` (Midnight Navy OLED) | `bg-[#0A0E17]` |
| Surface | `#141926` (Dark Slate) | `bg-[#141926]` |
| Surface Elevated | `#1C2235` | `bg-[#1C2235]` |
| Primary | `#3B82F6` (Blue-500) | `text-blue-500`, `bg-blue-500` |
| Accent | `#60A5FA` (Blue-400) | `text-blue-400`, `bg-blue-400` |
| Text Primary | `#F1F5F9` (Slate-100) | `text-slate-100` |
| Text Muted | `#94A3B8` (Slate-400) | `text-slate-400` |
| Success | `#22C55E` | `text-green-500` |
| Danger | `#EF4444` | `text-red-500` |
| Warning | `#F59E0B` | `text-amber-500` |
| Border | `#1E293B` (Slate-800) | `border-slate-800` |

---

## 2. Tipografía

| Uso | Font | Peso | Clases |
|-----|------|------|--------|
| Headings | Plus Jakarta Sans | 600–700 | `font-pjk-sans font-semibold` |
| Body | Plus Jakarta Sans | 400–500 | `font-pjk-sans` |
| Datos / Cifras / KPIs | JetBrains Mono | 500–600 | `font-mono` |

### Escala de tipografía

| Elemento | Tamaño | Clase |
|----------|--------|-------|
| KPI Value (large) | 28–32px | `text-2xl lg:text-3xl font-mono font-semibold` |
| KPI Value (normal) | 20–24px | `text-xl lg:text-2xl font-mono font-semibold` |
| KPI Value (small) | 16–18px | `text-lg font-mono font-semibold` |
| Section Title | 16–18px | `text-lg font-semibold text-slate-100` |
| Card Title | 14px | `text-sm font-medium text-slate-100` |
| Body | 14px | `text-sm text-slate-400` |
| Label / Eyebrow | 12px | `text-xs text-slate-400 uppercase tracking-wider` |

---

## 3. Espaciado

| Contexto | Gap | Clase |
|----------|-----|-------|
| KPIs primarios | 12px | `gap-3` |
| Gráficos / Paneles | 16px | `gap-4` |
| Secciones | 24px | `gap-6` |
| Padding interno paneles | 16px | `p-4` |
| Padding KPI small | 12px | `p-3` |
| Padding KPI normal | 16px | `p-4` |
| Padding KPI large | 20px | `p-5` |

---

## 4. Layout del Dashboard

### 4.1 Header

```tsx
<header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-[#141926]/95 backdrop-blur-sm">
  {/* Contenido: logo, título, acciones */}
</header>
```

- **Posición:** `sticky top-0 z-40`
- **Altura:** `h-16`
- **Borde:** `border-b border-slate-800`
- **Fondo:** `bg-[#141926]/95 backdrop-blur-sm`

### 4.2 Contenido principal

```tsx
<main className="p-4 md:p-6 space-y-6">
  {/* Secciones del dashboard */}
</main>
```

### 4.3 Grids Asimétricos (OBLIGATORIO)

El dashboard usa grids **asimétricos** para evitar el "AI look".

#### KPIs primarios — 3 columnas asimétricas

```tsx
<div className="grid grid-cols-[1fr_1.5fr_1fr] gap-3">
  <KpiCard size="normal" />   {/* 1fr = ~30% */}
  <KpiCard size="large" />    {/* 1.5fr = ~40% — KPI principal */}
  <KpiCard size="normal" />   {/* 1fr = ~30% */}
</div>
```

- **Regla:** El KPI principal siempre al centro con mayor peso visual (40%).
- Los KPIs secundarios a los lados (30% cada uno).

#### Fila mixta — Gráfico principal + KPIs secundarios

```tsx
<div className="grid grid-cols-[3fr_2fr] gap-4">
  <ChartPanel />          {/* 60% — gráfico principal */}
  <SecondaryKpis />      {/* 40% — KPIs secundarios */}
</div>
```

#### Paneles lado a lado (50/50)

```tsx
<div className="grid grid-cols-2 gap-4">
  <PanelA />
  <PanelB />
</div>
```

### 4.4 Secuencia de secciones del dashboard

```
1. Header (sticky)
2. KPIs primarios (grid-cols-[1fr_1.5fr_1fr], gap-3)
3. Gráfico principal + KPIs secundarios (grid-cols-[3fr_2fr], gap-4)
4. Paneles lado a lado (grid-cols-2, gap-4)
5. Secciones adicionales (gap-6 entre secciones)
```

---

## 5. Componentes

### 5.1 KPI Cards

Tres tamaños que controlan padding y altura mínima:

| Tamaño | Padding | Min Height | Clases | Uso |
|--------|---------|------------|--------|-----|
| `small` | `p-3` | 100px | `rounded-lg border border-slate-800 bg-[#141926] p-3 min-h-[100px]` | KPIs secundarios |
| `normal` | `p-4` | 120px | `rounded-lg border border-slate-800 bg-[#141926] p-4 min-h-[120px]` | KPIs estándar |
| `large` | `p-5` | 140px | `rounded-lg border border-slate-800 bg-[#141926] p-5 min-h-[140px]` | KPI principal |

#### Estructura interna de KPI Card

```tsx
<div className="rounded-lg border border-slate-800 bg-[#141926] p-4 min-h-[120px]">
  {/* Fila superior: icono + label */}
  <div className="flex items-center gap-2 mb-2">
    <IconComponent className="h-4 w-4 text-slate-400" />
    <span className="text-xs text-slate-400 uppercase tracking-wider">
      Label del KPI
    </span>
  </div>

  {/* Valor principal — JetBrains Mono */}
  <div className="text-xl lg:text-2xl font-mono font-semibold text-slate-100">
    $1,234,567
  </div>

  {/* Fila inferior: tendencia + sparkline */}
  <div className="flex items-center gap-2 mt-2">
    <span className="text-xs font-medium text-green-500">+12.5%</span>
    <Sparkline data={trendData} trend="up" />
  </div>
</div>
```

### 5.2 Paneles

```tsx
<div className="rounded-lg border border-slate-800 bg-[#141926] p-4">
  <h3 className="text-sm font-medium text-slate-100 mb-4">
    Título del Panel
  </h3>
  {/* Contenido */}
</div>
```

- **Border:** `border border-slate-800`
- **Background:** `bg-[#141926]`
- **Border radius:** `rounded-lg` (8px) — **máximo permitido**

### 5.3 Sparklines

```tsx
<LineChart
  data={data}
  width={200}
  height={32}  // h-8
  className="w-full h-8"
>
  <Line
    type="monotone"
    dataKey="value"
    stroke={trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : '#94A3B8'}
    strokeWidth={1.5}
    dot={false}
  />
</LineChart>
```

- **Altura:** `h-8` (32px)
- **Ancho:** `w-full`
- **Stroke:** `1.5px`
- **Dots:** `false` (sin puntos)
- **Color:** según tendencia (`text-green-500` subida, `text-red-500` bajada, `text-slate-400` neutro)

### 5.4 Header

```tsx
<header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-[#141926]/95 backdrop-blur-sm">
  <div className="flex h-full items-center justify-between px-4 md:px-6">
    <div className="flex items-center gap-3">
      <h1 className="text-lg font-semibold text-slate-100">Panel de control</h1>
    </div>
    {/* Acciones del header */}
  </div>
</header>
```

### 5.5 Iconos

- **Librería:** Solo Lucide React
- **Tamaño estándar:** `h-4 w-4` (16px) para labels, `h-5 w-5` (20px) para acciones
- **Color:** `text-slate-400` (muted), `text-blue-400` (accent)
- **NUNCA:** Emojis como iconos de interfaz

### 5.6 Estados de color

| Estado | Clase de texto | Contexto |
|--------|---------------|----------|
| Positivo / Subida | `text-green-500` | Tendencia alcista, éxito |
| Negativo / Bajada | `text-red-500` | Tendencia bajista, error |
| Advertencia | `text-amber-500` | Alertas, pendientes |
| Neutro / Informativo | `text-slate-400` | Labels, datos sin tendencia |
| Destacado / Accent | `text-blue-400` | Elementos primarios, links |

---

## 6. Anti-patterns — Anti "AI look"

### ❌ PROHIBIDO

| Patrón | Por qué | Alternativa |
|--------|---------|-------------|
| `repeat(auto-fit, minmax(...))` uniforme | Crea simetría predecible | Grids asimétricos explícitos |
| Simetría perfecta, cards idénticas en fila | Look genérico AI | KPI principal más grande al centro |
| Bordes redondeados grandes (16px+) | Infantil, poco profesional | `rounded-lg` (8px) máximo |
| Sombras difusas (`shadow-xl` grande) | Exagerado, poco sutil | Bordes sólidos (`border-slate-800`) |
| `hover:scale-105` en grids densos | Desplaza layout, causa layout shift | Solo `transition-colors duration-200` |
| Transiciones de posición/escala | Movimiento innecesario | Solo color/opacity, 200ms |
| Gradientes decorativos sin propósito | Ruido visual | Superficies planas y limpias |
| Cards shadcn planas genéricas | Sin personalización visual | Componentes customizados con tokens OLED |
| Animaciones > 300ms en micro-interacciones | Lentitud percibida | 150–200ms |
| Emojis como iconos | No profesional | Lucide icons |

### ✅ ADOPTAR

| Patrón | Beneficio |
|--------|-----------|
| Grids asimétricos: `grid-cols-[1fr_1.5fr_1fr]` | Jerarquía visual natural |
| KPI principal 40%, secundarios 30% | Inmediata comprensión de prioridad |
| Transiciones solo de color/opacity | Movimiento sutil, profesional |
| 200ms duration, ease-out | Respuesta percibida como instantánea |
| Bordes sólidos en superficies oscuras | Separación clara sin sombra |
| JetBrains Mono para datos | Legibilidad de cifras, look técnico |

---

## 7. Responsive

### Breakpoints

| Breakpoint | Comportamiento |
|------------|---------------|
| `< 768px` (móvil) | KPIs primarios: `grid-cols-1` (stack vertical). Gráfico + secundarios: `grid-cols-1`. Paneles: `grid-cols-1`. |
| `≥ 768px` (tablet) | KPIs primarios: `grid-cols-[1fr_1.5fr_1fr]`. Gráfico + secundarios: `grid-cols-[3fr_2fr]`. Paneles: `grid-cols-2`. |
| `≥ 1024px` (desktop) | Se mantiene layout tablet. Padding: `p-6`. |
| `≥ 1440px` (wide) | Se mantiene layout tablet. Contenido centrado. |

### Reglas responsive

- **Móvil:** Todo stack vertical. KPIs en columna simple.
- **Tablet:** Se activan grids asimétricos.
- **Touch targets:** Mínimo 44px para elementos interactivos en móvil.
- **Bottom nav móvil:** Etiquetas + targets ≥ 44px (si aplica).

---

## 8. Accesibilidad

| Requisito | Implementación |
|-----------|---------------|
| Contraste texto | `text-slate-100` sobre `bg-[#141926]` = ratio ≥ 7:1 |
| Contraste muted | `text-slate-400` sobre `bg-[#141926]` = ratio ≥ 4.5:1 |
| Focus visible | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E17]` |
| `prefers-reduced-motion` | Respetado. Sin animaciones si el usuario lo solicita. |
| Semantic HTML | `<header>`, `<main>`, `<section>`, `<h1>`–`<h3>` jerárquicos |
| Labels | Todo KPI con label visible (`text-xs uppercase`) |

---

## 9. Estados de datos

Todo componente que renderice datos debe manejar:

| Estado | Visualización |
|--------|--------------|
| **Loading** | Skeleton pulsante: `animate-pulse bg-[#1C2235]` en placeholders |
| **Empty** | Mensaje contextual: `text-slate-400 text-sm` con icono Lucide |
| **Error** | Borde `border-red-500/50`, título en `text-red-500`, detalle en `text-slate-400` |
| **Default** | Renderizado normal con datos |

---

## 10. Animación y Motion

| Tipo | Duración | Easing | Uso |
|------|----------|--------|-----|
| Color/opacity transition | 200ms | `ease-out` | Hover, focus, active states |
| Background transition | 200ms | `ease-out` | Surface hover states |
| Border transition | 200ms | `ease-out` | Focus rings |

### Reglas

- **Solo** transiciones de `color`, `opacity`, `background-color`, `border-color`
- **NUNCA** `transform: scale()`, `translate()`, o `rotate()` en hover de grids densos
- **Framer Motion** solo para entrada de página (`fade-in`, `stagger`) — no para micro-interacciones de cards
- Respetar `prefers-reduced-motion`: deshabilitar transiciones si el usuario lo solicita

---

## 11. Checklist de implementación

Antes de entregar código de dashboard:

- [ ] Background OLED: `bg-[#0A0E17]` en `<main>`
- [ ] KPIs primarios en `grid-cols-[1fr_1.5fr_1fr]` (asimétrico)
- [ ] Gráfico principal + secundarios en `grid-cols-[3fr_2fr]`
- [ ] Paneles en `grid-cols-2` con `gap-4`
- [ ] KPI Cards con tokens correctos (surface, border, mono font)
- [ ] Sparklines: `h-8`, `strokeWidth={1.5}`, `dot={false}`
- [ ] Header: `sticky top-0 z-40 h-16` con backdrop-blur
- [ ] Border radius máximo `rounded-lg` (8px)
- [ ] Solo Lucide icons, sin emojis
- [ ] JetBrains Mono para valores numéricos
- [ ] Transiciones: solo color/opacity, 200ms
- [ ] Sin `hover:scale` en grids densos
- [ ] Estados: loading (skeleton), empty, error, default
- [ ] Focus visible con ring azul
- [ ] Responsive: mobile stack, tablet+ asimétrico
- [ ] `prefers-reduced-motion` respetado

---

## 12. Referencias

- **Master actual:** `design-system/marfyl-blue-horizon/MASTER.md`
- **Master legacy (deprecated):** `design-system/marfyl/MASTER.md`
- **CSS variables:** `src/app/globals.css`
- **Tailwind config:** `tailwind.config.ts`
- **Iconos:** `lucide-react` (devDependency confirmado)
- **Charts:** `recharts` (devDependency confirmado)
- **Motion:** `framer-motion` (dependency confirmado)
- **Animaciones CSS:** Solo `transition-colors duration-200 ease-out`
