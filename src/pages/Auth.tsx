import { LoginForm } from '@/components/auth/LoginForm';
import { withPageAccessibility } from '@/lib/withPageAccessibility';

const Auth = () => {
  return <LoginForm />;
};

export default withPageAccessibility(Auth);