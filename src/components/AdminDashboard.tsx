// src/components/AdminDashboard.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTab } from './AdminUsersTab';
import { AdminArticlesTab } from './AdminArticlesTab';
import { AdminCommentsTab } from './AdminCommentsTab';
import { AdminSeriesTab } from './AdminSeriesTab';
import { AdminSubscriptionsTab } from './AdminSubscriptionsTab'; // <-- ایمپورت جدید
import { AdminSupportTab } from './AdminSupportTab';

export const AdminDashboard = () => {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="users">کاربران</TabsTrigger>
        <TabsTrigger value="articles">مقالات</TabsTrigger>
        <TabsTrigger value="series">سری‌ها</TabsTrigger>
        <TabsTrigger value="comments">نظرات</TabsTrigger>
        <TabsTrigger value="subscriptions">اشتراک‌ها</TabsTrigger> {/* <-- تب جدید */}
        <TabsTrigger value="support">تیکت‌ها</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <AdminUsersTab />
      </TabsContent>
      <TabsContent value="articles">
        <AdminArticlesTab />
      </TabsContent>
      <TabsContent value="series">
        <AdminSeriesTab />
      </TabsContent>
      <TabsContent value="comments">
        <AdminCommentsTab />
      </TabsContent>
      <TabsContent value="subscriptions">
        <AdminSubscriptionsTab /> {/* <-- محتوای تب جدید */}
      </TabsContent>
      <TabsContent value="support">
        <AdminSupportTab />
      </TabsContent>
    </Tabs>
  );
};
