'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { slugifyOrganizationName } from '@/lib/org-slug';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slugTouched && organizationName) {
      setOrganizationSlug(slugifyOrganizationName(organizationName));
    }
  }, [organizationName, slugTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const slug = slugifyOrganizationName(organizationSlug || organizationName);
      const { access_token, user } = await authService.register({
        email,
        password,
        fullName,
        organizationName: organizationName.trim(),
        organizationSlug: slug,
      });
      setAuth(user as unknown as Parameters<typeof setAuth>[0], access_token);
      const firstOrgId = user.organizations?.[0]?.id;
      if (firstOrgId) {
        useAuthStore.getState().selectOrganization(firstOrgId);
      }
      router.push('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setError(
        Array.isArray(msg)
          ? msg.join(', ')
          : typeof msg === 'string'
            ? msg
            : 'Error al crear la cuenta. Revisa los datos e intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full card-elevated">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Crear cuenta y empresa</CardTitle>
        <CardDescription className="text-center">
          Registra tu usuario y tu negocio en MARFYL. Entrarás directo a tu panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Tu nombre completo
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <hr className="border-border" />
          <p className="text-sm font-medium text-muted-foreground">Tu empresa</p>
          <div className="space-y-2">
            <label htmlFor="organizationName" className="text-sm font-medium">
              Nombre comercial
            </label>
            <Input
              id="organizationName"
              type="text"
              placeholder="Mi Negocio C.A."
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="organizationSlug" className="text-sm font-medium">
              Identificador (URL interna)
            </label>
            <Input
              id="organizationSlug"
              type="text"
              placeholder="mi-negocio"
              value={organizationSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setOrganizationSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              required
              minLength={2}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Solo minúsculas, números y guiones. Plan BASIC activo al registrarte.
            </p>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta y entrar'}
          </Button>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
