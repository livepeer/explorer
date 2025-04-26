import { useState, useEffect } from 'react';
import { fetchVotesFromInfura } from './fetchVotes';
import { Vote } from '../components/Votes/types';

export function useVotes(proposalId: string) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposalId) return;
    let cancelled = false;
    setLoading(true);
    fetchVotesFromInfura(proposalId)
      .then(fetched =>
        !cancelled &&
        setVotes(fetched.sort((a,b) => parseFloat(b.weight) - parseFloat(a.weight)))
      )
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true };
  }, [proposalId]);

  return { votes, loading };
}
