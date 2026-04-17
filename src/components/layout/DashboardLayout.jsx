import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';

export default function DashboardLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen rtl" dir="rtl">
      <TopNavBar />
      <div className="flex min-h-screen pt-20 md:pt-0">
        <SideNavBar />
        <main className="flex-1 md:mr-64 p-6 lg:p-12 w-full max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
