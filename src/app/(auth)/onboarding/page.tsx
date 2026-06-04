'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { slugifyOrganizationName } from '@/lib/org-slug';

export default function OnboardingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.isSuperAdmin) {
      router.replace('/');
      return;
    }
    const orgs = user?.organizations ?? [];
    if (orgs.length > 0) {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

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
      const res = await apiClient.post<{
        access_token: string;
        organizationId: number;
        organizations: { id: number; name: string; slug: string; plan: string; role: string }[];
      }>('/auth/setup-organization', {
        organizationName: organizationName.trim(),
        organizationSlug: slug,
      });
      const orgs = res.data.organizations.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        plan: o.plan,
        role: o.role,
        currencyCode: 'USD',
        currencySymbol: '$',
        exchangeRate: 1,
        rateUpdatedAt: null,
      }));
      if (user && token) {
        setAuth({ ...user, organizations: orgs }, res.data.access_token);
        useAuthStore.getState().selectOrganization(res.data.organizationId);
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
            : 'No se pudo crear la empresa.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full card-elevated">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Registrar tu empresa</CardTitle>
        <CardDescription className="text-center">
          Completa el alta de tu negocio para acceder al panel MARFYL.
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
            <label htmlFor="organizationName" className="text-sm font-medium">
              Nombre comercial
            </label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="organizationSlug" className="text-sm font-medium">
              Identificador
            </label>
            <Input
              id="organizationSlug"
              value={organizationSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setOrganizationSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              required
              minLength={2}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear empresa y continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
