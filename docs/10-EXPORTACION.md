# 10 — Exportación CSV/PDF y Carga Masiva

---

## Exportación de Datos

### Estrategia

Usamos dos librerías:
- **papaparse** para CSV (rápido, liviano)
- **@react-pdf/renderer** para PDF (escribimos PDFs como componentes React)

### API de Exportación

```typescript
// apps/web/src/app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import Papa from 'papaparse';
import { PDFDocument, PDFPage } from '@/lib/pdf-templates';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entity, format, filters, columns } = await req.json();

  // 1. Obtener datos según filtros
  const data = await getFilteredData(entity, filters);

  // 2. Seleccionar columnas
  const filteredData = columns
    ? data.map((item: any) => {
        const row: Record<string, any> = {};
        columns.forEach((col: string) => {
          row[col] = item[col];
        });
        return row;
      })
    : data;

  // 3. Exportar según formato
  if (format === 'csv') {
    const csv = Papa.unparse(filteredData);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${entity}-${Date.now()}.csv"`,
      },
    });
  }

  if (format === 'pdf') {
    // Generar PDF con plantilla específica
    const pdfBuffer = await generatePDF(entity, filteredData, filters);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${entity}-${Date.now()}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}

async function getFilteredData(entity: string, filters: any) {
  const where: any = {};

  if (filters?.dateFrom) {
    where.createdAt = { gte: new Date(filters.dateFrom) };
  }
  if (filters?.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }
  if (filters?.validationStage) {
    where.validationStage = filters.validationStage;
  }
  if (filters?.role) {
    where.role = { name: filters.role };
  }
  if (filters?.academicProgramId) {
    where.academicProgramId = filters.academicProgramId;
  }

  switch (entity) {
    case 'users':
      return prisma.user.findMany({
        where,
        include: { role: true, academicProgram: true, universityCenter: true },
        orderBy: { createdAt: 'desc' },
      });
    case 'entrepreneurships':
      return prisma.entrepreneurship.findMany({
        where: filters?.validationStage
          ? { user: { validationStage: filters.validationStage } }
          : {},
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    case 'advisories':
      return prisma.advisory.findMany({
        include: { request: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });
    default:
      return [];
  }
}
```

### Componente de Exportación (Frontend)

```tsx
// apps/web/src/components/shared/ExportButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface ExportDialogProps {
  entity: string;
  filters?: Record<string, any>;
}

export function ExportDialog({ entity, filters }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity,
          format,
          filters: filters || {},
        }),
      });

      if (!res.ok) throw new Error('Error al exportar');

      // Descargar archivo
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Exportar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar {entity}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={format === 'csv' ? 'default' : 'outline'}
              onClick={() => setFormat('csv')}
            >
              CSV
            </Button>
            <Button
              variant={format === 'pdf' ? 'default' : 'outline'}
              onClick={() => setFormat('pdf')}
            >
              PDF
            </Button>
          </div>

          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Exportando...' : 'Descargar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Página de Exportación (Admin)

```tsx
// apps/web/src/app/(dashboard)/admin/exportar/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ExportDialog } from '@/components/shared/ExportButton';

export default function ExportPage() {
  const [entity, setEntity] = useState('users');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    validationStage: '',
    role: '',
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exportar Datos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Entidad</label>
              <Select
                value={entity}
                onValueChange={setEntity}
                options={[
                  { value: 'users', label: 'Usuarios' },
                  { value: 'entrepreneurships', label: 'Emprendimientos' },
                  { value: 'advisories', label: 'Asesorías' },
                  { value: 'diagnostics', label: 'Diagnósticos' },
                ]}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Etapa de Validación</label>
              <Select
                value={filters.validationStage}
                onValueChange={(v) => setFilters({ ...filters, validationStage: v })}
                options={[
                  { value: '', label: 'Todas' },
                  { value: 'FULLY_VALIDATED', label: 'Validados' },
                  { value: 'PENDING_PROFILE', label: 'Perfil Pendiente' },
                  { value: 'PROFILE_COMPLETED', label: 'Perfil Completo' },
                  { value: 'DIAGNOSTICS_DONE', label: 'Diagnóstico Listo' },
                  { value: 'LETTER_UPLOADED', label: 'Carta Subida' },
                ]}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <ExportDialog entity={entity} filters={filters} />
            <Button
              variant="ghost"
              onClick={() => setFilters({ dateFrom: '', dateTo: '', validationStage: '', role: '' })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Carga Masiva CSV

### Estrategia

Usamos **papaparse** para parsear el CSV y luego insertamos en BD con Prisma.

### Componente de Carga

```tsx
// apps/web/src/components/shared/FileUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
  endpoint: string;
  onSuccess?: (results: any) => void;
  templateUrl?: string;
}

export function FileUpload({ endpoint, onSuccess, templateUrl }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Leer y parsear CSV
    const text = await file.text();
    const Papa = (await import('papaparse')).default;
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (result.errors.length > 0) {
      toast.error('Error en el archivo CSV');
      return;
    }

    setPreview(result.data);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!preview) return;
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: preview }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Carga exitosa: ${result.count} registros`);
        onSuccess?.(result);
        setPreview(null);
      } else {
        toast.error(result.message || 'Error en la carga');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {templateUrl && (
        <a
          href={templateUrl}
          download
          className="text-sm text-blue-600 hover:underline"
        >
          Descargar plantilla CSV
        </a>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Suelta el archivo aquí...</p>
        ) : (
          <p>Arrastra un archivo CSV o haz clic para seleccionar</p>
        )}
      </div>

      {preview && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Vista previa: {preview.length} registros
          </p>
          <div className="max-h-40 overflow-y-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className="px-2 py-1 text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-2 py-1">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? 'Cargando...' : `Cargar ${preview.length} registros`}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### API de Carga Masiva

```typescript
// apps/web/src/app/api/admin/upload-csv/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await req.json();
  let count = 0;
  const errors: string[] = [];

  // Buscar rol por defecto
  const emprendedorRole = await prisma.role.findUnique({
    where: { name: 'EMPRENDEDOR' },
  });

  for (const row of data) {
    try {
      await prisma.user.create({
        data: {
          email: row.email,
          name: row.name || row.nombre,
          roleId: emprendedorRole!.id,
          documentType: row.tipo_documento,
          documentNumber: row.numero_documento,
          phone: row.telefono,
          gender: row.genero?.toUpperCase() || 'OTRO',
          maritalStatus: row.estado_civil,
          validationStage: 'PENDING_PROFILE',
        },
      });
      count++;
    } catch (error: any) {
      errors.push(`Fila ${count + 2}: ${error.message}`);
    }
  }

  // Log de auditoría
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: `bulk-${Date.now()}`,
      newValue: { count, errors },
    },
  });

  return NextResponse.json({
    success: true,
    count,
    errors: errors.length > 0 ? errors : undefined,
  });
}
```

### Plantilla CSV de Ejemplo

```csv
email,name,tipo_documento,numero_documento,telefono,genero,estado_civil
juan.perez@uniminuto.edu,Juan Pérez,CC,1234567890,3001234567,MASCULINO,Soltero
maria.garcia@uniminuto.edu,María García,CC,9876543210,3019876543,FEMENINO,Casada
```
