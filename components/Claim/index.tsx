import { LAYOUT_MAX_WIDTH } from "@layouts/main";
import { l2Migrator } from "@lib/api/abis/bridge/L2Migrator";
import { getL2MigratorAddress } from "@lib/api/contracts";
import { useCallback } from 'react';
import { Box, Button, Container, Flex, Text } from "@jjasonn.stone/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { ethers } from "ethers";
import {
  useAccountAddress,
  useHandleTransaction,
  useL1DelegatorData,
} from "hooks";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useEffect, useState } from "react";
import {
  useSimulateContract,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { Address as ViemAddress } from "viem";

const l2MigratorAddress = getL2MigratorAddress() as `0x${string}`;

const Claim = () => {
  const accountAddress = useAccountAddress();
  const l1Delegator = useL1DelegatorData(accountAddress);

  const [proof, setProof] = useState<any>(null);
  const [migrationParams, setMigrationParams] = useState<any>(undefined);
  const [isDelegator, setIsDelegator] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate contract interaction
  const { data: simulateData } = useSimulateContract({
    address: l2MigratorAddress,
    abi: l2Migrator,
    functionName: "claimStake",
    args: [
      migrationParams?.delegate,
      migrationParams?.stake,
      migrationParams?.fees,
      proof,
      ethers.ZeroAddress as `0x${string}`,
    ],
  });

  // Read contract state
  const { data: isClaimEnabled } = useReadContract({
    address: l2MigratorAddress,
    abi: l2Migrator,
    functionName: "claimStakeEnabled",
  });

  const { data: migratedDelegators } = useReadContract({
    address: l2MigratorAddress,
    abi: l2Migrator,
    functionName: "migratedDelegators",
    args: [accountAddress as `0x${string}`],
  });

  // Write contract interaction
  const { writeContract, data: writeData, isPending, isSuccess, error } = useWriteContract();

  // Handle the write operation
  const handleClaim = useCallback(async () => {
    if (simulateData) {
      writeContract({...simulateData.request});
    }
  }, [simulateData, writeContract]);

  useEffect(() => {
    const fetchProof = async () => {
      try {
        const response = await fetch(
          `/api/l1-delegator/${accountAddress}`
        );
        const data = await response.json();
        setProof(data.proof);
        setMigrationParams(data.migrationParams);
        setIsDelegator(data.isDelegator);
      } catch (err) {
        console.error("Error fetching proof:", err);
      } finally {
        setLoading(false);
      }
    };

    if (accountAddress) {
      fetchProof();
    }
  }, [accountAddress]);

  useEffect(() => {
    if (proof && !isPending) {
      handleClaim();
    }
  }, [proof, handleClaim, isPending]);

  useHandleTransaction(
    "claimStake",
    writeData ? { hash: writeData } : undefined,
    error,
    isPending,
    isSuccess,
    {
      delegate: migrationParams?.delegate,
      stake: migrationParams?.stake,
      fees: migrationParams?.fees,
      newDelegate: ethers.ZeroAddress,
    },
    () => {
      // refetch();
    }
  );

  useEffect(() => {
    const init = async () => {
      if (accountAddress && l2Migrator && l1Delegator) {
        setLoading(true);

        // reset on account change
        setIsDelegator(false);

        setMigrationParams({
          delegate: l1Delegator.delegateAddress,
          stake: l1Delegator.pendingStake,
          fees: l1Delegator.pendingFees,
        });

        if (
          l1Delegator.transcoderStatus === "not-registered" &&
          (l1Delegator.pendingStake !== "0" ||
            l1Delegator.pendingFees !== "0" ||
            l1Delegator.unbondingLocks.length > 1)
        ) {
          setIsDelegator(true);
        }
        setLoading(false);
      }
    };
    init();
  }, [accountAddress, l1Delegator]);

  return loading || !isDelegator || migratedDelegators ? null : (
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, mb: "$5" }}>
      <Box
        css={{
          mt: "$5",
          borderRadius: 10,
          width: "100%",
          padding: "$4",
          background:
            "linear-gradient(91.88deg, #113123 0.27%, #164430 36.6%, #1B543A 69.35%, #236E4A 98.51%)",
        }}
      >
        <Box>
          <Box
            css={{
              mb: "$2",
              fontSize: "$6",
              fontWeight: 600,
            }}
          >
            Claim stake & fees on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
          </Box>

          <Text>
            Your delegated stake of
            <Box
              css={{
                display: "inline",
                fontWeight: 700,
                borderBottom: "1px dashed $neutral11",
                fontSize: "$3",
                color: "$hiContrast",
                mx: "$1",
                letterSpacing: "-.4px",
              }}
            >
              {ethers.formatEther(migrationParams?.stake)} LPT
            </Box>
            and
            <Box
              css={{
                display: "inline",
                fontWeight: 700,
                fontSize: "$3",
                color: "$hiContrast",
                borderBottom: "1px dashed $neutral11",
                mx: "$1",
                letterSpacing: "-.4px",
              }}
            >
              {ethers.formatEther(migrationParams.fees)} ETH
            </Box>
            in earned fees{" "}
            {isClaimEnabled
              ? `is available to claim on ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}.`
              : `will be available to claim on ${CHAIN_INFO[DEFAULT_CHAIN_ID].label} upon deployment of the delegator
          state snapshot.`}
          </Text>
        </Box>
        <Box
          css={{
            mt: "$3",
            mb: "$5",
            maxWidth: 350,
          }}
        >
          <Text
            css={{
              fontSize: "$1",
              lineHeight: 1.9,
              color: "rgba(255,255,255, .6)",
            }}
          >
            Delegating with
          </Text>
          <Box
            className="delegateAddress"
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: "$1",
              borderBottom: "1px solid rgba(255,255,255, .2)",
            }}
          >
            {migrationParams.delegate.replace(
              migrationParams.delegate.slice(6, 38),
              "…"
            )}
          </Box>
        </Box>
        <Flex css={{ mt: "$3", alignItems: "center" }}>
          {isClaimEnabled && (
            <Button
              onClick={async () => {
                try {
                  const res = await fetch("/api/generateProof", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      account: accountAddress,
                      delegate: migrationParams.delegate,
                      stake: migrationParams.stake,
                      fees: migrationParams.fees,
                    }),
                  });
                  const proof = await res.json();

                  setProof(proof);
                } catch (e) {
                  console.log(e);
                  throw new Error((e as Error)?.message);
                }
              }}
              size="3"
              variant="neutral"
              css={{ mr: "$2" }}
            >
              Claim Stake & Fees
            </Button>
          )}
          <Button
            as="a"
            href="https://discord.gg/XYJ7aVNqkS"
            target="_blank"
            size="3"
            variant="neutral"
            ghost
          >
            Discord Support Channel{" "}
            <Box css={{ ml: "$1" }} as={ArrowTopRightIcon} />
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default Claim;
