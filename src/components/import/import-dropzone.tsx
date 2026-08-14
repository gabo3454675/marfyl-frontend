'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, FileSpreadsheet, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type ImportDropzoneProps = {
  accept: string;
  multiple?: boolean;
  hint: string;
  files?: File[];
  onFiles: (files: File[]) => void;
  className?: string;
  /** Abre la cámara del celular (foto de factura). */
  allowCamera?: boolean;
};

export function ImportDropzone({
  accept,
  multiple = false,
  hint,
  files,
  onFiles,
  className,
  allowCamera = false,
}: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const arr = Array.from(list);
      if (arr.length) onFiles(arr);
    },
    [onFiles],
  );

  const label =
    files && files.length > 0
      ? files.length === 1
        ? files[0].name
        : `${files.length} archivos listos`
      : 'Toca para elegir o suelta aquí';

  return (
    <div className="space-y-2">
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        pick(e.dataTransfer.files);
      }}
      className={cn(
        'flex w-full min-h-[10rem] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition touch-manipulation sm:min-h-[11rem] sm:py-10',
        dragOver
          ? 'border-primary bg-primary/10'
          : 'border-border/80 bg-muted/25 hover:border-primary/45 hover:bg-muted/40',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-6 w-6 text-primary" aria-hidden />
      </span>
      <span className="max-w-full truncate px-2 text-sm font-semibold sm:text-base">{label}</span>
      <span className="max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">{hint}</span>
      {files && files.length > 0 && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
          Cambiar archivo
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
    </button>
    {allowCamera && (
      <>
        <ButtonCamera
          onClick={() => cameraRef.current?.click()}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = '';
          }}
        />
      </>
    )}
    </div>
  );
}

function ButtonCamera({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 text-sm font-medium hover:bg-muted/50"
    >
      <Camera className="h-4 w-4" aria-hidden />
      Tomar foto de la factura
    </button>
  );
}
