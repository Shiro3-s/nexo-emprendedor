# 05 — Autenticación con Microsoft Azure AD + NextAuth.js

---

## Estrategia de Autenticación

Usamos **NextAuth.js v5** con:
- **Proveedor principal:** Microsoft Azure AD (Entra ID) — para usuarios @uniminuto.edu
- **Proveedor secundario:** Credentials (email + password) — para administradores y emergencias

---

## Configuración de Azure AD (UNIMINUTO)

### Paso 1: Registrar la aplicación en Azure Portal

1. Ir a https://portal.azure.com → Azure Active Directory → App registrations
2. "New registration"
   - Name: `Nexo Emprendedor`
   - Supported account types: `Accounts in this organizational directory only` (Single tenant)
   - Redirect URI: `https://uniminuto.nexoemprendedor.com/api/auth/callback/azure-ad`

3. Anotar:
   - `Application (client) ID`
   - `Directory (tenant) ID`

### Paso 2: Generar Client Secret

1. Certificates & secrets → New client secret
2. Anotar el valor del secret

### Paso 3: Configurar API Permissions

1. API permissions → Add a permission
2. Microsoft Graph → Delegated permissions:
   - `email`
   - `openid`
   - `profile`
   - `User.Read`

---

## Implementación con NextAuth.js

### Configuración de Auth

```typescript
// apps/web/src/lib/auth.ts
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import { getTenant } from './tenant';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true },
        });

        if (!user || !user.passwordHash) return null;
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Validar dominio del email contra el tenant
      const tenant = await getTenant();
      if (!tenant) return false;

      const userEmail = user.email || '';
      if (!userEmail.endsWith(tenant.emailDomain)) {
        return false; // Rechazar si el dominio no coincide
      }

      // Si es primer inicio de sesión con Azure AD, crear usuario
      if (account?.provider === 'azure-ad' && profile) {
        const existingUser = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!existingUser) {
          // Buscar rol emprendedor por defecto
          const emprendedorRole = await prisma.role.findFirst({
            where: { name: 'EMPRENDEDOR' },
          });

          await prisma.user.create({
            data: {
              email: userEmail,
              name: profile.name || userEmail.split('@')[0],
              roleId: emprendedorRole!.id,
              validationStage: 'PENDING_PROFILE',
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
});
```

### API Route de Auth

```typescript
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

### Middleware de Protección

```typescript
// apps/web/src/middleware.ts (ampliado)
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Rutas públicas
  const isPublicRoute = nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register') ||
    nextUrl.pathname === '/';

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (isLoggedIn) {
    // Redirigir según rol
    if (nextUrl.pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    if (nextUrl.pathname.startsWith('/asesor') && userRole !== 'ASESOR') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    if (nextUrl.pathname.startsWith('/emprendedor') && userRole !== 'EMPRENDEDOR') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next|static|img|favicon.ico).*)'],
};
```

### Componente de Login

```tsx
// apps/web/src/components/auth/LoginForm.tsx
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAzureLogin = () => {
    signIn('azure-ad', { callbackUrl: '/dashboard' });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
    });
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Iniciar Sesión</h1>

      <Button
        onClick={handleAzureLogin}
        className="w-full mb-4"
        variant="default"
      >
        Iniciar con Microsoft (UNIMINUTO)
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">
            O continuar con email
          </span>
        </div>
      </div>

      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <Input
          type="email"
          placeholder="Correo institucional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
}
```

---

## Variables de Entorno

```env
# apps/web/.env.example
NEXTAUTH_URL=https://uniminuto.nexoemprendedor.com
NEXTAUTH_SECRET=generar-con-random-string

# Azure AD
AZURE_AD_CLIENT_ID=tu-client-id
AZURE_AD_CLIENT_SECRET=tu-client-secret
AZURE_AD_TENANT_ID=uniminuto-tenant-id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexo_emprendedor
```
