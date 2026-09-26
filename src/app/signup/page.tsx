import { SignupForm } from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Registro de docente | Posesión Docente - SED Magdalena',
  description: 'Registro de docentes con validación de la autorización de notificación electrónica firmada vía Ciudadano Digital.',
};

export default function SignupPage() {
  return <SignupForm />;
}
