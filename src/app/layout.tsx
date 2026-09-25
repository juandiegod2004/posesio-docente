import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'No Pierdas el Viaje - Secretaría de Educación',
  description: 'Sistema de autenticación y gestión del programa No Pierdas el Viaje de la Secretaría de Educación.',
  icons: {
    icon: '/logo-secretaria-educacion.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${jakarta.variable} font-sans`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-indigo-100 selection:text-indigo-800">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
