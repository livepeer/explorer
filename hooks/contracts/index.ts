import { QueryFunction, useQuery } from "@tanstack/react-query";
import { useLivepeerContracts } from "hooks/useLivepeerContracts";

const useContractRead = <T>(key: string, reqFn: QueryFunction<T>) => {
  return useQuery([key], reqFn);
};



export const useTotalProtocolStake = (blockNumber?: number) => {
  const { livepeerToken, minter } = useLivepeerContracts();

  return useContractRead("useTotalProtocolStake", async () =>
    livepeerToken.balanceOf(minter.address, {
      blockTag: blockNumber,
    })
  );
};

