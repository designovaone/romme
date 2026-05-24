import { redirect } from 'next/navigation';
import { verifySession } from '../../_lib/dal';
import { getLastUsedPlayerPair } from '../../_lib/queries';
import { NewMatchForm } from './NewMatchForm';

export default async function NewMatchPage() {
  const session = await verifySession();
  if (!session.valid) redirect('/login');

  const defaults = await getLastUsedPlayerPair();
  return <NewMatchForm defaultLeft={defaults.left} defaultRight={defaults.right} />;
}
