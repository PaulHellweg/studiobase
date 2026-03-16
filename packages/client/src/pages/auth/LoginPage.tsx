import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/bookings';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      addToast(t('auth.loginSuccess', 'Welcome back!'), 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message ?? t('auth.loginError', 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent>
          <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-6 text-center">
            {t('auth.login', 'Log In')}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email', 'Email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label={t('auth.password', 'Password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-[--color-danger]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading', 'Loading...') : t('auth.login', 'Log In')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            <Link to="/auth/forgot-password" className="text-[--color-primary] hover:underline block">
              {t('auth.forgotPassword', 'Forgot password?')}
            </Link>
            <p className="text-[--color-text-muted]">
              {t('auth.noAccount', "Don't have an account?")}{' '}
              <Link to="/auth/register" className="text-[--color-primary] hover:underline">
                {t('nav.register', 'Sign Up')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
