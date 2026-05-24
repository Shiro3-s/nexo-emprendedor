export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Nexo Emprendedor</h1>
      <p className="text-lg text-gray-600 mb-8">
        Plataforma SaaS de Gestión de Emprendimientos
      </p>
      <a
        href="/auth/login"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Iniciar Sesión
      </a>
    </main>
  );
}
