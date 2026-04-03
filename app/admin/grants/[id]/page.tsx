import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EditGrantClient, type InitialGrantForEdit } from './EditGrantClient';

export default async function EditGrantPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const grant = await prisma.grant.findUnique({
    where: { id },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!grant) {
    notFound();
  }

  const initialGrant: InitialGrantForEdit = {
    id: grant.id,
    title: grant.title,
    organization: grant.organization,
    amount: grant.amount,
    amountMin: grant.amountMin,
    amountMax: grant.amountMax,
    deadline: grant.deadline ? grant.deadline.toISOString().split('T')[0] : '',
    location: grant.location,
    eligibility: grant.eligibility,
    description: grant.description,
    applicationUrl: grant.applicationUrl,
    category: grant.category,
    tags: grant.tags,
  };

  return <EditGrantClient key={grant.id} grantId={grant.id} initialGrant={initialGrant} />;
}
