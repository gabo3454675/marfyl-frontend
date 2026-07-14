'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import { fiscalService, type FiscalTaxpayerType } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ShieldCheck } from 'lucide-react';
import { FiscalAssistantHint } from '@/components/assistant/fiscal-assistant-hint';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';
import { ContentFaqSheet } from '@/components/help/content-faq-sheet';
import { FISCAL_FAQ } from '@/lib/content/faq-content';

type TaxpayerType = FiscalTaxpayerType;

export default function FiscalPerfilPage() {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxpayerType, setTaxpayerType] = useState<TaxpayerType>('ORDINARIO');
  const [isWithholdingAgent, setIsWithholdingAgent] = useState(false);
  const [isSubjectToWithholding, setIsSubjectToWithholding] = useState(false);
  const [isSpecialTaxpayer, setIsSpecialTaxpayer] = useState(false);
  const [isFormalTaxpayer, setIsFormalTaxpayer] = useState(false);
  const [controlSeriesPrefix, setControlSeriesPrefix] = useState('01');
  const [nextControlSequence, setNextControlSequence] = useState(1);

  useEffect(() => {
    if (!canManageFiscal) {
      router.replace('/');
      return;
    }
    fiscalService
      .getProfile()
      .then((res) => {
        const org = res.organization;
        const p = res.profile;
        setTaxId(p?.taxId ?? org?.taxId ?? '');
        setLegalName(p?.legalName ?? org?.legalName ?? org?.nombre ?? '');
        setTaxpayerType(p?.taxpayerType ?? 'ORDINARIO');
        setIsWithholdingAgent(p?.isWithholdingAgent ?? false);
        setIsSubjectToWithholding(p?.isSubjectToWithholding ?? false);
        setIsSpecialTaxpayer(org?.isSpecialTaxpayer ?? false);
        setIsFormalTaxpayer(org?.isFormalTaxpayer ?? false);
        setControlSeriesPrefix(p?.controlSeriesPrefix ?? '01');
        setNextControlSequence(p?.nextControlSequence ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [canManageFiscal, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fiscalService.upsertProfile({
        taxId: taxId.trim() || undefined,
        legalName: legalName.trim() || undefined,
        taxpayerType,
        isWithholdingAgent,
        isSubjectToWithholding,
        isSpecialTaxpayer,
        isFormalTaxpayer,
        controlSeriesPrefix,
        nextControlSequence,
      });
      toast.success('Perfil fiscal guardado');
    } catch {
      toast.error('No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (!canManageFiscal) return null;

  return (
    <FiscalShell
      title="Perfil fiscal"
      subtitle="RIF, régimen SENIAT y numeración de control para facturación."
      actions={
        <ContentFaqSheet
          title="Perfil y cumplimiento"
          description="RIF, retenciones, libros y responsabilidades ante SENIAT."
          items={FISCAL_FAQ}
          triggerLabel="FAQ fiscal"
          variant="ghost"
        />
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_min(280px,22rem)] lg:items-start">
        <div className="fiscal-v0-panel w-full min-w-0">
          <div className="flex items-start gap-3 pb-5 border-b border-border/60 mb-6">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Identificación del contribuyente</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Datos del emisor para libros y SENIAT</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="taxId">RIF</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="J-12345678-9"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="legalName">Razón social</Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tipo de contribuyente</Label>
                <Select value={taxpayerType} onValueChange={(v) => setTaxpayerType(v as TaxpayerType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                    <SelectItem value="ESPECIAL">Especial</SelectItem>
                    <SelectItem value="FORMAL">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Régimen y retenciones
              </p>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={isWithholdingAgent}
                  onChange={(e) => setIsWithholdingAgent(e.target.checked)}
                />
                Agente de retención de IVA
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={isSubjectToWithholding}
                  onChange={(e) => setIsSubjectToWithholding(e.target.checked)}
                />
                Sujeto a retención en compras
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={isSpecialTaxpayer}
                  onChange={(e) => setIsSpecialTaxpayer(e.target.checked)}
                />
                Contribuyente especial (calendario SENIAT)
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={isFormalTaxpayer}
                  onChange={(e) => setIsFormalTaxpayer(e.target.checked)}
                />
                Contribuyente formal
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
              <div className="space-y-2">
                <Label htmlFor="series">Serie control (2 díg.)</Label>
                <Input
                  id="series"
                  value={controlSeriesPrefix}
                  onChange={(e) => setControlSeriesPrefix(e.target.value)}
                  maxLength={2}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seq">Próximo N° control</Label>
                <Input
                  id="seq"
                  type="number"
                  min={1}
                  value={nextControlSequence}
                  onChange={(e) => setNextControlSequence(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <p className="font-mono text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2.5 w-full">
              Próximo emitido: {controlSeriesPrefix.padStart(2, '0').slice(-2)}-
              {String(nextControlSequence).padStart(8, '0')}
            </p>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar perfil
              </Button>
            </div>
          </div>
        </div>
        <FiscalAssistantHint />
        </div>
      )}
    </FiscalShell>
  );
}
