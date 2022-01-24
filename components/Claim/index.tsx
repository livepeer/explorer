import {
  Box,
  Text,
  Flex,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  TextField,
  Link as A,
} from "@livepeer/design-system";
import { ChevronDownIcon, Link1Icon } from "@modulz/radix-icons";
import { useWeb3React } from "@web3-react/core";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  INFURA_NETWORK_URLS,
  l1Migrator,
  L1_CHAIN_ID,
  l2Migrator,
} from "constants/chains";
import { ethers } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import LivepeerSDK from "@livepeer/sdk";

const getDelegatorOnL1 = async (account) => {
  const sdk = await LivepeerSDK({
    controllerAddress: CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
    provider: INFURA_NETWORK_URLS[L1_CHAIN_ID],
    account: account,
  });
  const delegator = await sdk.rpc.getDelegator(account);
  const status = await sdk.rpc.getTranscoderStatus(account);
  return { delegator, status };
};

const Claim = () => {
  const context = useWeb3React();
  const [migrationParams, setMigrationParams] = useState(undefined);
  const [isOrchestrator, setIsOrchestrator] = useState(true);
  const [delegateMigrated, setDelegateMigrated] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (context.account) {
        setLoading(true);

        const { delegator, status } = await getDelegatorOnL1(context.account);

        // fetch calldata to be submitted for calling L2 function
        // const { params } = await l1Migrator.getMigrateDelegatorParams(
        //   context.account,
        //   context.account
        // );

        setIsOrchestrator(status === "Registered" ? true : false);

        setMigrationParams({
          delegate: delegator.delegateAddress,
          stake: delegator.pendingStake.toString(),
          fees: delegator.pendingFees.toString(),
          isOrchestrator: status === "Registered" ? true : false,
        });
        setLoading(false);
      }
    };
    init();
  }, [context.account]);

  useEffect(() => {
    const init = async () => {
      if (context.account) {
        const migrated = await l2Migrator.migratedDelegators(context.account);
        setDelegateMigrated(migrated);
      }
    };
    init();
  }, [context.account]);

  return loading || isOrchestrator ? null : (
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
            {ethers.utils.formatEther(migrationParams.stake)} LPT
          </Box>
          {/* <Box css={{ display: "inline" }}>
            delegated with
            <Box
              css={{
                display: "inline",
                fontWeight: 700,
                borderBottom: "1px dashed $neutral11",
                fontSize: "$3",
                color: "$hiContrast",
                ml: "$1",
                letterSpacing: "-.4px",
              }}
            >
              {migrationParams.delegate.replace(
                migrationParams.delegate.slice(6, 38),
                "…"
              )}
            </Box>
            ,
          </Box>{" "} */}
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
            {ethers.utils.formatEther(migrationParams.fees)} ETH
          </Box>
          in earned fees will be available to claim on{" "}
          {CHAIN_INFO[DEFAULT_CHAIN_ID].label} upon deployment of the delegator
          state snapshot.
        </Text>
      </Box>
      {/* {!delegateMigrated && (
        <Dialog>
          <DialogTrigger asChild>
            <Box
              css={{
                mt: "$3",
                mb: "$5",
                maxWidth: 300,
                cursor: "pointer",
                "&:hover": {
                  ".delegateAddress": {
                    transition: ".2s border-bottom",
                    borderBottom: "1px solid rgba(255,255,255, 1)",
                  },
                },
              }}
            >
              <Text
                css={{
                  fontSize: "$1",
                  lineHeight: 1.9,
                  color: "rgba(255,255,255, .6)",
                }}
              >
                Continue delegating with
              </Text>
              <Box
                className="delegateAddress"
                css={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  pb: "$1",
                  borderBottom: "1px solid rgba(255,255,255, .2)",
                  transition: ".1s border-bottom",
                  "&:hover": {
                    transition: ".1s border-bottom",
                    borderBottom: "1px solid rgba(255,255,255, 1)",
                  },
                }}
              >
                {migrationParams.delegate.replace(
                  migrationParams.delegate.slice(6, 38),
                  "…"
                )}

                <Box css={{ mr: "$2" }} as={ChevronDownIcon} />
              </Box>
            </Box>
          </DialogTrigger>
          <DialogContent css={{ p: 0 }}>
            <Box css={{ minWidth: 375 }}>
              <Flex
                css={{
                  py: "$2",
                  px: "$4",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid $neutral5",
                }}
              >
                <DialogTitle asChild>
                  <TextField
                    size="3"
                    css={{
                      boxShadow: "none",
                      border: 0,
                      fontSize: "$4",
                      bc: "transparent",
                      "&:active": {
                        border: 0,
                        boxShadow: "none",
                      },
                      "&:focus": {
                        border: 0,
                        boxShadow: "none",
                      },
                    }}
                    placeholder="Search orchestrators..."
                  />
                </DialogTitle>
              </Flex>

              <Box
                css={{
                  overflowY: "scroll",
                  maxHeight: 300,
                }}
              >
                <Box css={{ px: "$3", pb: "$4" }}>
                  <OrchestratorCard active />
                  <OrchestratorCard />
                  <OrchestratorCard />
                  <OrchestratorCard />
                  <OrchestratorCard />
                  <OrchestratorCard />
                  <OrchestratorCard />
                </Box>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )} */}

      {/* <Flex css={{ mt: "$3", alignItems: "center" }}>
        <Button
          onClick={async () => {
            const signer = l2Migrator.connect(context.library.getSigner());
            try {
              const tx = await signer.claimStake(
                migrationParams.delegate,
                migrationParams.stake.toString(),
                migrationParams.fees.toString(),
                [],
                ethers.constants.AddressZero
              );
              console.log(tx);
            } catch (e) {
              console.log(e);
            }
          }}
          size="3"
          variant="transparentWhite"
          disabled
          css={{ mr: "$2" }}
        >
          Claim Stake & Fees
        </Button>
        <Button size="3" variant="transparentWhite" ghost>
          Learn More
        </Button>
      </Flex> */}
    </Box>
  );
};

const OrchestratorCard = ({ active = false, css = {} }) => {
  return (
    <Box
      css={{
        p: "$3",
        bc: "transparent",
        border: "1px solid transparent",
        borderTop: "1px solid $neutral5",
        cursor: active ? "default" : "pointer",
        "&:before": {
          boxShadow: "none",
        },
        "&:first-child": {
          borderTop: "1px solid transparent",
        },
        "&:hover": {
          borderRadius: "$4",
          border: "1px solid",
          borderColor: active ? "transparent" : "$neutral5",
          bc: active ? "transparent" : "$neutral4",
        },
        "&:hover:not(:first-child) + div": {
          borderTop: "1px solid transparent",
        },
        ...css,
      }}
    >
      <Box css={{ opacity: active ? 0.3 : "1" }}>
        <Flex
          css={{
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 600,
            fontSize: "$3",
          }}
        >
          titannode.eth (Titan Node)
          <Link
            href={`/accounts/0xbe8770603daf200b1fa136ad354ba854928e602b/orchestrating`}
            passHref
          >
            <A
              target="_blank"
              rel="noopener noreferrer"
              css={{
                transition: ".2s background-color",
                p: "$1",
                borderRadius: 1000,
                "&:hover": {
                  bc: "$neutral6",
                  transition: ".2s background-color",
                },
              }}
            >
              <Box as={Link1Icon} />
            </A>
          </Link>
        </Flex>
        <Flex
          css={{
            color: "$neutral10",
            fontSize: "$2",
            mt: "$1",
            gap: "$2",
            flexWrap: "wrap",
          }}
          gap="2"
        >
          <Box
            css={{
              fontWeight: 700,
            }}
          >
            20% reward cut,
          </Box>
          <Box
            css={{
              fontWeight: 700,
            }}
          >
            20% fee cut
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Claim;
