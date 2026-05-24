import { notFound, redirect } from 'next/navigation';
import { verifySession } from '../../../_lib/dal';
import { getMatch } from '../../../_lib/queries';
import { EditClient } from './EditClient';

type Params = { id: string };

export default async function EditMatchPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const session = await verifySession();
  if (!session.valid) redirect('/login');

  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();
  return <EditClient match={match} />;
}
