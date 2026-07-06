'use client';

import { useState } from 'react';
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
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { supplierService } from '@/lib/api/suppliers';
import type { Supplier, CreateSupplierPayload } from '@/lib/api/suppliers';

export default function SuppliersPage() {
  const { canManageExpenses, canDelete } = usePermission();

  const {
    data: suppliers,
    pagination,
    isLoading: loading,
    page,
    setPage,
    search,
    setSearch,
    refetch,
  } = usePaginatedQuery<Supplier>({
    queryKey: ['suppliers'],
    url: '/suppliers',
    limit: 20,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        taxId: supplier.taxId || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else {
      setEditingSupplier(null);
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
    setEditingSupplier(null);
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
      const supplierData: CreateSupplierPayload = {
        name: formData.name,
        taxId: formData.taxId || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, supplierData);
        alert('Proveedor actualizado exitosamente');
      } else {
        await supplierService.create(supplierData);
        alert('Proveedor creado exitosamente');
      }

      handleCloseDialog();
      refetch();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      alert(error.response?.data?.message || 'Error al guardar el proveedor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      return;
    }

    try {
      await supplierService.remove(id);
      alert('Proveedor eliminado exitosamente');
      refetch();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      alert(error.response?.data?.message || 'Error al eliminar el proveedor');
    }
  };

  if (!canManageExpenses) {
    return (
      <AdminPageShell eyebrow="Finanzas" title="Proveedores" subtitle="Acceso restringido">
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
      eyebrow="Finanzas"
      title="Proveedores"
      subtitle="Gestiona los proveedores de tu organización."
      loading={loading && suppliers.length === 0}
      actions={
        canManageExpenses ? (
          <Button onClick={() => handleOpenDialog()} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        ) : undefined
      }
    >
      <AdminCard
        title="Lista de proveedores"
        headerActions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        ) : suppliers.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            {search ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
          </p>
        ) : (
          <AdminTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>RIF/NIT</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.taxId || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canManageExpenses && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(supplier.id)}
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

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {suppliers.length} de {pagination.total} proveedores
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Dialog para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier
                  ? 'Modifica los datos del proveedor'
                  : 'Completa los datos para crear un nuevo proveedor'}
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
                  <Label htmlFor="taxId">RIF/NIT</Label>
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
                    editingSupplier ? 'Actualizar' : 'Crear'
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
