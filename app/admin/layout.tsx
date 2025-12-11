import { ReactNode } from 'react';
import { AdminHeader } from '@/components/AdminHeader';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminHeader />
      {children}
    </>
  );
}







