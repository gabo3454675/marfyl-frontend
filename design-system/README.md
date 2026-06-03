# Design System Hierarchy

> **Last updated:** 2026-06-03

## Structure

```
design-system/
├── README.md           (this file)
├── marfyl/             LEGACY — deprecated
└── marfyl-blue-horizon/  CURRENT — active
```

## Directory Status

| Directory | Status | Description |
|-----------|--------|-------------|
| `marfyl/` | **DEPRECATED** | Dark Materials design (Cashmere, Sunset Coral, Darkmoon). **Do not use for new development.** |
| `marfyl-blue-horizon/` | **ACTIVE** | Blue Horizon design (blue #3B82F6, white, slate). Current implementation. |

## Migration

The redesign from Dark Materials to Blue Horizon was completed in 8 phases (2026-06-03). The new design system:

- Uses light mode as default (both light/dark supported via `.dark` class)
- Primary color: `#3B82F6` (blue-500)
- Accent color: `#0284C7` (sky-600)
- Background: `#F8FAFC` (slate-50)
- Text: `#0F172A` (slate-900)

## References

- Implementation: `src/app/globals.css`
- Current design: `design-system/marfyl-blue-horizon/MASTER.md`
- Legacy (deprecated): `design-system/marfyl/MASTER.md`