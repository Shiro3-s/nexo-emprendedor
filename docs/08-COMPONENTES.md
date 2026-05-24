# 08 — Componentes y Páginas del Frontend

---

## Principios de UI

- **shadcn/ui** como base de componentes (accesibles, estilizados con Tailwind)
- **Server Components** por defecto, Client Components solo cuando se necesita interactividad
- **Formularios con React Hook Form + Zod** para validación
- **Tablas con DataTable** (shadcn/ui) con paginación, ordenamiento y filtros
- **Tema dinámico** según el tenant (colores, logo)

---

## Componentes Base (shadcn/ui)

```bash
# Inicializar shadcn/ui
npx shadcn@latest init

# Componentes a instalar
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add form
npx shadcn@latest add progress
npx shadcn@latest add alert
npx shadcn@latest add skeleton
```

---

## Layout del Dashboard

```tsx
// apps/web/src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen">
      <Sidebar role={session.user.role} />
      <div className="flex-1 flex flex-col">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Sidebar

```tsx
// apps/web/src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuByRole = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
    { label: 'Asesores', href: '/admin/asesores', icon: '👨‍🏫' },
    { label: 'Asesorías', href: '/admin/asesorias', icon: '📅' },
    { label: 'Emprendimientos', href: '/admin/emprendimientos', icon: '🚀' },
    { label: 'Diagnósticos', href: '/admin/diagnosticos', icon: '📋' },
    { label: 'Cartas', href: '/admin/cartas', icon: '📄' },
    { label: 'Eventos', href: '/admin/eventos', icon: '🎉' },
    { label: 'Exportar', href: '/admin/exportar', icon: '📤' },
    { label: 'Carga CSV', href: '/admin/carga-masiva', icon: '📁' },
    { label: 'Auditoría', href: '/admin/auditoria', icon: '🔍' },
    { label: 'Configuración', href: '/admin/configuracion', icon: '⚙️' },
  ],
  ASESOR: [
    { label: 'Dashboard', href: '/asesor', icon: '📊' },
    { label: 'Asesorías', href: '/asesor/asesorias', icon: '📅' },
    { label: 'Emprendimientos', href: '/asesor/emprendimientos', icon: '🚀' },
    { label: 'Seguimientos', href: '/asesor/seguimientos', icon: '📈' },
    { label: 'Perfil', href: '/asesor/perfil', icon: '👤' },
  ],
  EMPRENDEDOR: [
    { label: 'Dashboard', href: '/emprendedor', icon: '📊' },
    { label: 'Mi Perfil', href: '/emprendedor/perfil', icon: '👤' },
    { label: 'Emprendimiento', href: '/emprendedor/emprendimiento', icon: '🚀' },
    { label: 'Diagnóstico', href: '/emprendedor/diagnostico', icon: '📋' },
    { label: 'Carta Compromiso', href: '/emprendedor/carta-compromiso', icon: '📄' },
    { label: 'Asesorías', href: '/emprendedor/asesorias', icon: '📅' },
    { label: 'Eventos', href: '/emprendedor/eventos', icon: '🎉' },
    { label: 'Seguimiento', href: '/emprendedor/seguimiento', icon: '📈' },
    { label: 'Recursos', href: '/emprendedor/recursos', icon: '📚' },
  ],
};

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const menuItems = menuByRole[role as keyof typeof menuByRole] || [];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo del tenant */}
      <div className="p-4 border-b border-sidebar-border">
        <TenantLogo />
      </div>

      {/* Menú */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent/50'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Usuario */}
      <div className="p-4 border-t border-sidebar-border">
        <UserMenu />
      </div>
    </aside>
  );
}
```

---

## Componentes Clave del Frontend

### Tabla de Datos (DataTable)

```tsx
// apps/web/src/components/shared/DataTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  onExport?: () => void;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = true,
  onExport,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  const filteredData = data.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {searchable && (
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        )}
        {onExport && (
          <Button onClick={onExport} variant="outline">
            Exportar
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {actions && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, i) => (
              <TableRow key={item.id || i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(item) : item[col.key]}
                  </TableCell>
                ))}
                {actions && <TableCell>{actions(item)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Formulario de Perfil (con validación Zod)

```tsx
// apps/web/src/components/forms/ProfileForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  documentType: z.string().min(1, 'Seleccione tipo de documento'),
  documentNumber: z.string().min(5, 'Número de documento inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  address: z.string().optional(),
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  gender: z.enum(['MASCULINO', 'FEMENINO', 'OTRO']),
  maritalStatus: z.string().min(1, 'Seleccione estado civil'),
  academicProgramId: z.string().min(1, 'Seleccione programa académico'),
  universityCenterId: z.string().min(1, 'Seleccione centro universitario'),
  semester: z.string().optional(),
  modality: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  catalogs: {
    documentTypes: { id: string; name: string }[];
    maritalStatuses: { id: string; name: string }[];
    academicPrograms: { id: string; name: string }[];
    universityCenters: { id: string; name: string }[];
  };
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

export function ProfileForm({ initialData, catalogs, onSubmit }: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData || {
      gender: 'MASCULINO',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos personales */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: 'MASCULINO', label: 'Masculino' },
                      { value: 'FEMENINO', label: 'Femenino' },
                      { value: 'OTRO', label: 'Otro' },
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={catalogs.documentTypes.map((dt) => ({
                      value: dt.id,
                      label: dt.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Civil</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={catalogs.maritalStatuses.map((cs) => ({
                      value: cs.id,
                      label: cs.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Institución */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="academicProgramId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programa Académico</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={catalogs.academicPrograms.map((ap) => ({
                      value: ap.id,
                      label: ap.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="universityCenterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro Académico</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={catalogs.universityCenters.map((uc) => ({
                      value: uc.id,
                      label: uc.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">
          {initialData ? 'Actualizar Perfil' : 'Completar Perfil'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Páginas por Rol

### Admin: Dashboard de Validaciones

```tsx
// apps/web/src/app/(dashboard)/admin/page.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const session = await auth();

  const [pendingProfiles, pendingDiagnostics, pendingLetters] = await Promise.all([
    prisma.user.count({
      where: { validationStage: 'PROFILE_COMPLETED' },
    }),
    prisma.user.count({
      where: { validationStage: 'DIAGNOSTICS_DONE' },
    }),
    prisma.user.count({
      where: { validationStage: 'LETTER_UPLOADED' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Perfiles Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pendingProfiles}</p>
            <p className="text-sm text-muted-foreground">
              Emprendedores esperando asesoría de bienvenida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnósticos por Revisar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pendingDiagnostics}</p>
            <p className="text-sm text-muted-foreground">
              Diagnósticos completados esperando verificación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cartas por Verificar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pendingLetters}</p>
            <p className="text-sm text-muted-foreground">
              Cartas de compromiso firmadas esperando aprobación
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Emprendedor: Página de Asesorías (solo solicitar)

```tsx
// apps/web/src/app/(dashboard)/emprendedor/asesorias/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AsesoriasPage() {
  const [loading, setLoading] = useState(false);
  const [advisories, setAdvisories] = useState([]);

  const requestAdvisory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emprendedor/request-advisory', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Solicitud de asesoría' }),
      });
      if (res.ok) {
        toast.success('Solicitud enviada. Espera la asignación de un asesor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Asesorías</h1>
        <Button onClick={requestAdvisory} disabled={loading}>
          {loading ? 'Enviando...' : 'Solicitar Asesoría'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Asesorías</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabla de asesorías */}
          <p className="text-muted-foreground">
            Las asesorías solicitadas aparecerán aquí una vez que un
            administrador las asigne a un asesor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Admin: Página de Usuarios con Validación

```tsx
// apps/web/src/app/(dashboard)/admin/usuarios/page.tsx
import { prisma } from '@/lib/db';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const stageLabels: Record<string, { label: string; variant: string }> = {
  PENDING_PROFILE: { label: 'Pendiente Perfil', variant: 'secondary' },
  PROFILE_COMPLETED: { label: 'Perfil Listo', variant: 'warning' },
  DIAGNOSTICS_ACCESS: { label: 'En Diagnóstico', variant: 'info' },
  DIAGNOSTICS_DONE: { label: 'Diagnóstico Listo', variant: 'warning' },
  LETTER_ACCESS: { label: 'Descargó Carta', variant: 'info' },
  LETTER_UPLOADED: { label: 'Carta Subida', variant: 'warning' },
  FULLY_VALIDATED: { label: 'Validado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'destructive' },
};

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    include: { role: true, academicProgram: true },
    orderBy: { createdAt: 'desc' },
  });

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rol', render: (u: any) => u.role.name },
    {
      key: 'validationStage',
      label: 'Validación',
      render: (u: any) => {
        const stage = stageLabels[u.validationStage];
        return <Badge variant={stage.variant as any}>{stage.label}</Badge>;
      },
    },
    { key: 'createdAt', label: 'Registro', render: (u: any) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Link href="/admin/usuarios/crear">
          <Button>Crear Usuario</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={users}
        actions={(user) => (
          <Link href={`/admin/usuarios/${user.id}`}>
            <Button variant="ghost" size="sm">Ver</Button>
          </Link>
        )}
      />
    </div>
  );
}
```
