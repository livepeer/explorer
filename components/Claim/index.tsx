import Stat from "@components/Stat";
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
import Link from "next/link";
const Claim = () => {
  return (
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
          Claim stake & fees on Arbitrum
        </Box>
        <Text>
          Your migrated stake of
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
            1,241.21 LPT
          </Box>
          and fees of
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
            1.2 ETH
          </Box>
          is available to claim on Arbitrum.
        </Text>
      </Box>
      <Dialog>
        <DialogTrigger asChild>
          <Box
            css={{
              mt: "$3",
              mb: "$5",
              borderBottom: "1px solid rgba(255,255,255, .2)",
              transition: ".1s border-bottom",
              pb: "$1",
              maxWidth: 300,
              cursor: "pointer",
              "&:hover": {
                transition: ".1s border-bottom",
                borderBottom: "1px solid rgba(255,255,255, 1)",
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
              css={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              titannode.eth <Box css={{ mr: "$2" }} as={ChevronDownIcon} />
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

      <Flex css={{ mt: "$3", alignItems: "center" }}>
        <Button size="3" variant="transparentWhite" css={{ mr: "$2" }}>
          Claim Stake & Fees
        </Button>
        <Button size="3" variant="transparentWhite" ghost>
          Learn More
        </Button>
      </Flex>
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
