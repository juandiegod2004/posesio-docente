import { SignupForm } from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Sign up | No Pierdas el Viaje - Secretaría de Educación',
  description: 'Registro de usuarios con validación de documento de autorización firmado.',
};

export default function SignupPage() {
  return <SignupForm />;
}
