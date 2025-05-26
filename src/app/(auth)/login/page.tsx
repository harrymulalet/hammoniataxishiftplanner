import { LoginForm } from '@/components/auth/login-form';
import SiteLogo from '@/components/shared/SiteLogo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <SiteLogo className="mx-auto h-12 w-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-foreground">
            Sign in to ShiftCycle
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your taxi shifts efficiently.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
