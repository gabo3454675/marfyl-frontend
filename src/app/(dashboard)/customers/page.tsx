'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Plus, Edit, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';

interface Customer {
  id: number;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export default function CustomersPage() {
  const { selectedCompanyId } = useAuthStore();
  const { canManageCustomers, canDelete } = usePermission();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [overdueCustomerIds, setOverdueCustomerIds] = useState<number[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchOverdueCustomerIds = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await apiClient.get<{ customerIds: number[] }>('/credits/overdue-customer-ids');
      setOverdueCustomerIds(res.data.customerIds || []);
    } catch {
      setOverdueCustomerIds([]);
    }
  }, [selectedCompanyId]);

  const fetchCustomers = useCallback(async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      const response = await apiClient.get<Customer[]>('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchOverdueCustomerIds();
  }, [fetchOverdueCustomerIds]);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        taxId: customer.taxId || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('El nombre es requerido');
      return;
    }

    setSubmitting(true);

    try {
      const customerData = {
        name: formData.name,
        taxId: formData.taxId || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      if (editingCustomer) {
        await apiClient.patch(`/customers/${editingCustomer.id}`, customerData);
        alert('Cliente actualizado exitosamente');
      } else {
        await apiClient.post('/customers', customerData);
        alert('Cliente creado exitosamente');
      }

      handleCloseDialog();
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.response?.data?.message || 'Error al guardar el cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      await apiClient.delete(`/customers/${id}`);
      alert('Cliente eliminado exitosamente');
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert(error.response?.data?.message || 'Error al eliminar el cliente');
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearchQuery) return customers;
    const query = debouncedSearchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.taxId?.toLowerCase().includes(query)
    );
  }, [customers, debouncedSearchQuery]);

  if (!canManageCustomers) {
    return (
      <AdminPageShell eyebrow="Ventas" title="Clientes" subtitle="Acceso restringido">
        <AdminCard>
          <p className="py-8 text-center text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Ventas"
      title="Clientes"
      subtitle="Gestiona tu base de clientes, contactos y documentos fiscales."
      loading={loading && customers.length === 0}
      actions={
        canManageCustomers ? (
          <Button onClick={() => handleOpenDialog()} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        ) : undefined
      }
    >
        <AdminCard
          title="Lista de clientes"
          headerActions={
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          }
          bodyClassName="pt-0 sm:pt-0"
        >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
            ) : (
              <AdminTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          {customer.name}
                          {overdueCustomerIds.includes(customer.id) && (
                            <span
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30"
                              title="Deuda vencida"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              Deuda vencida
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.taxId || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canManageCustomers && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </AdminTableWrap>
            )}

        {/* Dialog para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? 'Modifica los datos del cliente'
                  : 'Completa los datos para crear un nuevo cliente'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxId">Documento de Identidad (DNI/RIF)</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingCustomer ? 'Actualizar' : 'Crear'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </AdminCard>
    </AdminPageShell>
  );
}
