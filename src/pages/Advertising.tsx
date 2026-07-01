import { AdsDashboard } from '@/components/advertising/AdsDashboard';
import { useNavigate } from 'react-router-dom';

export default function Advertising() {
  const navigate = useNavigate();

  return (
    <AdsDashboard onBack={() => navigate(-1)} />
  );
}
