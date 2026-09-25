import { Suspense } from 'react';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';

export const metadata = {
  title: 'Acceso No Autorizado | No Pierdas el Viaje',
};

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <UnauthorizedView />
    </Suspense>
  );
}
