import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  const { t } = useTranslation();
  
  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('welcome.subtitle')}
      tagline={t('welcome.tagline2')}
      footerNote="Viver o melhor da vida contigo."
      showBackButton={true}
      backTo="/welcome"
    >
      <LoginForm />
    </AuthLayout>
  );
}