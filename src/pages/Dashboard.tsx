import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
};

export default Dashboard;