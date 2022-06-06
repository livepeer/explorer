import { gql } from "@apollo/client";

export const protocolDataQuery = gql`
  query protocol {
    protocol(id: 0) {
      id
      totalVolumeUSD
      totalVolumeETH
      participationRate
      inflation
      activeTranscoderCount
      delegatorsCount
      lockPeriod
    }
  }
`;
