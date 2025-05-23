import { useState, useEffect, useMemo } from 'react'
import { provider, VOTECAST_TOPIC0, contractInterface, CONTRACT_ADDRESS } from '@lib/chains'
import { useQuery } from '@apollo/client'
import { ethers } from "ethers";
import { GET_PROPOSALS_BY_IDS } from "../../apollo/treasuryProposals";
import { Vote } from 'apollo/subgraph';

export function useVoterVotes(voter: string) {
  const [logsLoading, setLogsLoading] = useState(true)
  const [rawVotes, setRawVotes]     = useState<Vote[]>([])
  const proposalIds = useMemo(() => Array.from(new Set(rawVotes.map(v => v.poll?.id))), [rawVotes])

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLogsLoading(true)
      try {
        const topic = ethers.utils.zeroPad(voter, 32)
        const logs = await provider.getLogs({ address: CONTRACT_ADDRESS, fromBlock:'earliest', toBlock:'latest', topics: [VOTECAST_TOPIC0, ethers.utils.hexlify(topic)] })
        if (cancelled) return
        const decoded = logs.map(log => {
          const args = contractInterface.parseLog(log).args
          return {
            
           id: log.transactionHash,
           voter: args.voter,
           choiceID: args.choiceID.toString(),
           poll : args.poll,
           registeredTranscoder: args.registeredTranscoder,
           voteStake: args.voteStake.toString(),
           nonVoteStake: args.nonVoteStake.toString(),
           __typename : args.__typename,
          } 
          })
        setRawVotes(decoded)
      } catch(e) {
        console.error(e)
      } finally {
        if (!cancelled) setLogsLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [voter])

  const { data, loading: proposalsLoading } = useQuery(GET_PROPOSALS_BY_IDS, {
    skip: proposalIds.length === 0,
    variables: { ids: proposalIds },
  })

  const votes: Vote[] = useMemo(() => {
    if (logsLoading || proposalsLoading) return []
    const map = new Map<string, { description: string; voteEnd: number }>()
    data?.treasuryProposals?.forEach((p: any) => {
      map.set(p.id, { description: p.description || '', voteEnd: p.voteEnd || 0 })
    })
    return rawVotes
      .map(r => {
        const meta = map.get(r.poll?.id ?? "") ?? { description: '', voteEnd: 0 }
        const title = (meta.description.split('\n')[0] || '').replace(/^#\s*/, '') || 'Unknown Proposal'
        return { ...r, endVote: meta.voteEnd, description: meta.description, proposalTitle: title }
      })
      .sort((a, b) => b.endVote - a.endVote)
  }, [rawVotes, data, logsLoading, proposalsLoading])

  return { votes, isLoading: logsLoading || proposalsLoading }
}
