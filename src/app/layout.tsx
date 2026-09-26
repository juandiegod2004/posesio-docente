import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Posesión Docente - Secretaría de Educación del Magdalena',
  description: 'Plataforma para la carga, seguimiento y validación de los documentos requeridos en el proceso de posesión docente de la Secretaría de Educación del Magdalena.',
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
    <html lang="es" className={`${inter.variable} font-sans`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-brand-100 selection:text-brand-800">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
