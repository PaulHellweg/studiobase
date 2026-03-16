import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent>
          <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-2 text-center">
            {t('auth.forgotPassword', 'Forgot Password')}
          </h1>
          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm text-[--color-text-muted] mb-4">
                {t('auth.resetSent', 'If an account exists with that email, we sent a reset link.')}
              </p>
              <Link to="/auth/login" className="text-[--color-primary] hover:underline text-sm">
                {t('auth.backToLogin', 'Back to login')}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[--color-text-muted] mb-6 text-center">
                {t('auth.resetInstructions', 'Enter your email to receive a password reset link.')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('auth.email', 'Email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common.loading', 'Loading...') : t('auth.sendReset', 'Send Reset Link')}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link to="/auth/login" className="text-[--color-primary] hover:underline">
                  {t('auth.backToLogin', 'Back to login')}
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
