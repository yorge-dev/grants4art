import { ReactNode } from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { VersionPatchNotes } from '@/components/VersionPatchNotes';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminHeader />
      {children}
      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '32px' }}>
        <div style={{ margin: '0 8px 32px 8px' }}>
          <VersionPatchNotes />
        </div>
      </div>
    </>
  );
}







