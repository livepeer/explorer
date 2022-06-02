import { gql } from "@apollo/client";

export const protocolDataByBlockQuery = gql`
  query protocol($block: Block_height) {
    protocol(id: 0, block: $block) {
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
