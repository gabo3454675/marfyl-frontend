'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supplierService } from '@/lib/api/suppliers';

interface CreateSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateSupplierDialog({ open, onOpenChange, onCreated }: CreateSupplierDialogProps) {
  const [formData, setFormData] = useState({ name: '', taxId: '', email: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      await supplierService.create(formData);
      onOpenChange(false);
      setFormData({ name: '', taxId: '', email: '', phone: '', address: '' });
      onCreated();
    } catch (error) {
      console.error('Error creating supplier:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Proveedor</DialogTitle>
          <DialogDescription>Registra un nuevo proveedor en el sistema</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Nombre *</Label>
            <Input
              id="supplier-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-taxId">RIF/ID</Label>
            <Input
              id="supplier-taxId"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-phone">Teléfono</Label>
            <Input
              id="supplier-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-address">Dirección</Label>
            <Input
              id="supplier-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="cursor-pointer" onClick={handleSave} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Crear'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
