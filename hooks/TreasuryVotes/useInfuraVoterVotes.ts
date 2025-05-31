import { useState, useEffect, useMemo } from 'react'
import { provider, VOTECAST_TOPIC0, contractInterface, CONTRACT_ADDRESS } from '@lib/chains'
import { useQuery } from '@apollo/client'
import { ethers } from "ethers";
import { GET_PROPOSALS_BY_IDS } from "../../apollo/treasuryProposals";
import { Vote } from '../../lib/api/types/votes';

export function useInfuraVoterVotes(voter: string) {
  const [logsLoading, setLogsLoading] = useState(true)
  const [rawVotes, setRawVotes]     = useState<Vote[]>([])
  const proposalIds = useMemo(() => Array.from(new Set(rawVotes.map(v => v.proposalId))), [rawVotes])

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLogsLoading(true)
      try {
        const topic = ethers.utils.zeroPad(voter, 32)
        const logs = await provider.getLogs({ address: CONTRACT_ADDRESS, fromBlock:'earliest', toBlock:'latest', topics: [VOTECAST_TOPIC0, ethers.utils.hexlify(topic)] })
        if (cancelled) return
        const transactions = logs.map(log => {
          const args = contractInterface.parseLog(log).args
          return {
            
           transactionHash: log.transactionHash,
            voter:           args.voter,
            choiceID:        args.support.toString(),
            proposalId:      args.proposalId.toString(),
            weight:          args.weight.toString(),
            reason:          args.reason ?? "",
          }
        })
        setRawVotes(transactions)
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
        const meta = map.get(r.proposalId) ?? { description: '', voteEnd: 0 }
        const title = (meta.description.split('\n')[0] || '').replace(/^#\s*/, '') || 'Unknown Proposal'
        return { ...r, endVote: meta.voteEnd, description: meta.description, proposalTitle: title }
      })
      .sort((a, b) => b.endVote - a.endVote)
  }, [rawVotes, data, logsLoading, proposalsLoading])

  return { votes, isLoading: logsLoading || proposalsLoading }
}
