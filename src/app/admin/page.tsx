// src/app/admin/page.tsx
import { AdminDashboard } from '@/components/AdminDashboard';

const AdminPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-journal mb-8">پنل مدیریت</h1>
                <AdminDashboard />
            </div>
        </div>
    );
};

export default AdminPage;