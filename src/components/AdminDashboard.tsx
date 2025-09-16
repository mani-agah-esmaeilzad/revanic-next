// src/components/AdminDashboard.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTab } from './AdminUsersTab';
import { AdminArticlesTab } from './AdminArticlesTab'; // <-- ایمپورت جدید
import { AdminCommentsTab } from './AdminCommentsTab'; // <-- ایمپورت جدید

export const AdminDashboard = () => {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="users">کاربران</TabsTrigger>
        <TabsTrigger value="articles">مقالات</TabsTrigger>
        <TabsTrigger value="comments">نظرات</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <AdminUsersTab />
      </TabsContent>
      <TabsContent value="articles">
        <AdminArticlesTab />
      </TabsContent>
      <TabsContent value="comments">
        <AdminCommentsTab />
      </TabsContent>
    </Tabs>
  );
};