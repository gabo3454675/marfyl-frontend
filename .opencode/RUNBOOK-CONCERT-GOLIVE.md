# Runbook — Go-Live Concert Module (MARFYL)

## 1. Prerequisites

- [ ] Backend repo clone listo en servidor de producción
- [ ] Frontend repo clone listo (o cuenta Render/Railway configurada)
- [ ] Dominio `api.marfyl.com`准备好了 (apunta al backend)
- [ ] Dominio `app.marfyl.com`准备好了 (apunta al frontend)
- [ ] Base de datos PostgreSQL limpia creada (no reutilizar DISIS)
- [ ] Cuenta Resend creada en resend.com
- [ ] Dominio de envío verificado en Resend (DNS records)
- [ ] Repository secrets/configurados en plataforma de deploy

---

## 2. Deploy Backend

### 2.1 Configurar variables de entorno

En el servidor o panel de deploy, crear archivo `.env` basado en `.env.example`:

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/marfyl_db

# Servidor
PORT=3001
NODE_ENV=production

# Módulo concierto
CONCERT_FEATURE_ENABLED=true
CONCERT_DEFAULT_SLUG=hemenegilda-capacidad

# JWT
JWT_SECRET=generar-clave-segura-min-32-chars

# URLs
FRONTEND_URL=https://app.marfyl.com

# Email (Resend) — completar con clave real
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=entradas@marfyl.com
RESEND_FROM_NAME=MARFYL Entradas
CONCERT_OWNER_NOTIFY_EMAIL=organizador@marfyl.com
```

### 2.2 Ejecutar migraciones

```bash
pnpm prisma migrate deploy
# o
npm run prisma:migrate
```

### 2.3 Iniciar servicio

```bash
# Producción (con pm2 recomendado)
pm2 start dist/src/main.js --name marfyl-backend

# Verificar health
curl https://api.marfyl.com/api/health
```

---

## 3. Deploy Frontend

### 3.1 Configurar variables de entorno

En el panel de deploy (Vercel/Render/Railway):

```
NEXT_PUBLIC_FEATURE_CONCERT=true
NEXT_PUBLIC_CONCERT_SLUG=hemenegilda-capacidad
NEXT_PUBLIC_API_URL=https://api.marfyl.com/api
```

### 3.2 Build y deploy

```bash
# Localmente para probar
cd marfyl-frontend
pnpm build
pnpm start

# En Vercel: hacer push a main y deploy automático
git push origin main
```

### 3.3 Verificar

```
https://app.marfyl.com/evento/hemenegilda-capacidad
```

---

## 4. Configurar Dominio Resend

### 4.1 Agregar DNS records

En tu proveedor de DNS (Namecheap/Cloudflare/etc):

| Tipo    | Nombre      | Valor                          |
|---------|-------------|--------------------------------|
| TXT     | (raíz)      | `v=spf1 include:resend.com ~all` |
| DKIM    | (crear en Resend) | Añadir registro desde panel Resend |
| MX      | (raíz)      | `mx1.resend.com`               |
| Custom  | (subdomain) | `反馈.resend.com` (para tracking) |

### 4.2 Verificar en Resend

1. Ir a https://resend.com/domains
2. Agregar dominio `marfyl.com`
3. Añadir todos los DNS records mostrados
4. Esperar verificación (puede tomar hasta 24h, usualmente minutos)
5. Una vez verificado, establecer como dominio de envío por defecto

### 4.3 Probar envío

Desde el backend, probar manualmente:
```bash
curl -X POST https://api.marfyl.com/api/concert/admin/orders/1/resend-email
```

O esperar una compra real.

---

## 5. Setup Evento

### 5.1 Inicializar evento (primera vez)

```bash
# Opción A: desde el panel admin
# Ir a https://app.marfyl.com/concierto
# Click en "Inicializar evento"

# Opción B: desde API
curl -X POST https://api.marfyl.com/api/concert/admin/setup \
  -H "Authorization: Bearer <jwt_admin_token>"
```

### 5.2 Verificar secciones creadas

```bash
curl https://api.marfyl.com/api/concert/public/hemenegilda-capacidad
```

Debe retornar evento con:
- sección `SALON` (66 asientos, 20 mesas)
- sección `VIP` (32 asientos)
- precios y métodos de pago

### 5.3 Ajustar precios (si necesario)

Los precios estándar son:
- SALON: USD $40
- VIP: USD $60

Para ajustar, modificar directamente en la base de datos:
```sql
UPDATE concert_seat SET price_usd = 50 WHERE tier_code = 'VIP';
UPDATE concert_seat SET price_usd = 35 WHERE tier_code = 'SALON';
```

O implementar futura pantalla de ajustes.

---

## 6. Test Purchase Flow

### 6.1 Simular compra completa

1. **Abrir página pública**
   ```
   https://app.marfyl.com/evento/hemenegilda-capacidad
   ```

2. **Seleccionar asientos**
   - Elegir mesa 05
   - Seleccionar 2 asientos disponibles

3. **Checkout**
   - Nombre: "Juan Pérez"
   - Cédula: "V-30987654"
   - Teléfono: "+584121234567"
   - Email: "juan@ejemplo.com" ⚠️ Obligatorio
   - Método: Pago Móvil
   - Referencia: 12345678

4. **Confirmar compra**
   - Click "Confirmar compra"
   - Debería redirigir a `/entrada/<token>`

5. **Verificar estado pendiente**
   - Pantalla muestra "Pago en revisión"
   - Mensaje: "Cuando el organizador confirme su pago..."

### 6.2 Confirmar desde admin

1. **Ir a órdenes**
   ```
   https://app.marfyl.com/concierto/ordenes
   ```

2. **Confirmar pago**
   - Buscar la orden de "Juan Pérez"
   - Click "Confirmar"
   - Status cambia a "Pagado"

3. **Verificar email**
   - Revisar bandeja de juan@ejemplo.com
   - Debe tener email con QR y entradas
   - Badge "Email enviado" aparece en admin

4. **Verificar entrada pública**
   - Ir al link "Entrada" en la orden
   - Muestra QR y tickets
   - Mensaje "Revisa tu correo — te enviamos tus entradas"

---

## 7. Verify Scanner

### 7.1 Abrir escáner

```
https://app.marfyl.com/concierto/escaner
```

### 7.2 Probar scan válido

1. Usar el QR de la compra anterior
2. Click "Escanear" o pegar el payload
3. Debe mostrar: "Entrada válida" + nombre del comprador

### 7.3 Probar scan duplicado

1. Escanear el mismo QR nuevamente
2. Debe mostrar: "Entrada ya usada" + timestamp

### 7.4 Probar scan inválido

1. Escanear QR random o malformado
2. Debe mostrar: "Entrada no válida"

---

## 8. Monitoring

### 8.1 Logs de backend

```bash
# Si usa pm2
pm2 logs marfyl-backend --lines 100

# Buscar errores específicos
pm2 logs marfyl-backend | grep -i error
```

### 8.2 Métricas clave

- `/concert/admin/overview` — stats del evento
- `emailSentAt` en órdenes pagadas — verificar emails se envían
- Rate limit: `/concert/admin/orders/:id/resend-email` tiene límite

### 8.3 Alertas suggested

- Failed email sends (Resend marca errores)
- Órdenes pendientes > 24h sin confirmar
- Spike en errores 5xx del API concert

---

## Checklist Final

```
✅ Backend desplegado y responding
✅ Frontend desplegado y accessible
✅ Dominio Resend verificado
✅ Evento inicializado (secciones + asientos creados)
✅ Prueba de compra completada (pendiente → pagado → email)
✅ Escáner funciona (válido, duplicado, inválido)
✅ Badge "Email enviado" aparece en admin
✅ Link público copiable funciona
```

---

## Rollback

Si algo falla severamente:

1. **Desactivar módulo temporalmente**
   ```
   CONCERT_FEATURE_ENABLED=false
   ```
   Reiniciar backend.

2. **Mantener base de datos** — no eliminar, tiene datos de producción.

3. **Comunicar a organizadores** — usar canal de backup definido.