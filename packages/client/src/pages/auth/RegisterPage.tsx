import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      addToast(t('auth.registerSuccess', 'Account created!'), 'success');
      navigate('/bookings', { replace: true });
    } catch (err: any) {
      setError(err.message ?? t('auth.registerError', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent>
          <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-6 text-center">
            {t('auth.register', 'Create Account')}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.name', 'Full Name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
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
              autoComplete="new-password"
              helpText={t('auth.passwordHelp', 'At least 8 characters')}
            />
            <Input
              label={t('auth.confirmPassword', 'Confirm Password')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-[--color-danger]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading', 'Loading...') : t('auth.register', 'Create Account')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[--color-text-muted]">
            {t('auth.haveAccount', 'Already have an account?')}{' '}
            <Link to="/auth/login" className="text-[--color-primary] hover:underline">
              {t('nav.login', 'Log In')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
