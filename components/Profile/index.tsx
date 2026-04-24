import { ExplorerTooltip } from "@components/ExplorerTooltip";
import ShowMoreRichText from "@components/ShowMoreRichText";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { formatAddress } from "@lib/utils";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Flex,
  Heading,
  Link as A,
  Text,
} from "@livepeer/design-system";
import {
  CheckIcon,
  CopyIcon,
  GitHubLogoIcon,
  GlobeIcon,
  TwitterLogoIcon,
} from "@modulz/radix-icons";
import copy from "copy-to-clipboard";
import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { LuBell } from "react-icons/lu";

import EditProfile from "../EditProfile";

interface Props {
  account: string;
  isActive: boolean;
  isMyAccount: boolean;
  isOrchestrator?: boolean;
  css?: object;
  identity: EnsIdentity;
}

const Index = ({
  account,
  isMyAccount = false,
  isOrchestrator = false,
  identity,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);

  const handleCopyCommand = useCallback(() => {
    if (copy(`/subscribe ${account}`)) {
      setCommandCopied(true);
      setTimeout(() => setCommandCopied(false), 2000);
    }
  }, [account]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = () => {
    if (copy(account)) {
      setCopied(true);
    }
  };

  return (
    <Box css={{ marginBottom: "$3" }}>
      <Flex
        css={{
          alignItems: "flex-start",
          "@bp2": {
            alignItems: "center",
          },
        }}
      >
        <Box
          css={{
            width: 60,
            height: 60,
            maxWidth: 60,
            maxHeight: 60,
            position: "relative",
            "@bp3": {
              width: 70,
              height: 70,
              maxWidth: 70,
              maxHeight: 70,
            },
          }}
        >
          {identity?.avatar ? (
            <Box
              as="img"
              css={{
                objectFit: "cover",
                border: "1px solid",
                borderColor: "$hiContrast",
                borderRadius: 1000,
                width: "100%",
                height: "100%",
              }}
              src={identity.avatar}
            />
          ) : (
            <Box
              css={{
                border: "1px solid",
                borderRadius: "50%",
                height: "inherit",
                padding: "4px",
                width: "inherit",
              }}
            >
              <Box
                css={{
                  borderRadius: "50%",
                  height: "100%",
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                <QRCodeCanvas
                  fgColor={`#${account.substr(2, 6)}`}
                  size={60}
                  value={account}
                />
              </Box>
            </Box>
          )}
        </Box>
        <Flex
          justify="center"
          direction="column"
          css={{ height: "100%", marginLeft: "$3", flex: 1, minWidth: 0 }}
        >
          <Flex
            css={{
              alignItems: "center",
              width: "100%",
              minWidth: 0,
              columnGap: "$2",
              rowGap: "$2",
              flexWrap: "wrap",
              "@bp2": {
                alignItems: "center",
                columnGap: "$3",
                rowGap: 0,
                flexWrap: "nowrap",
              },
            }}
          >
            <Flex
              css={{
                alignItems: "center",
                minWidth: 0,
                maxWidth: "100%",
                flexShrink: 1,
              }}
            >
              <Heading
                size="2"
                css={{
                  display: "block",
                  fontWeight: 700,
                  minWidth: 0,
                  maxWidth: "100%",
                  flexShrink: 1,
                }}
              >
                <Box
                  as="span"
                  css={{
                    display: "block",
                    minWidth: 0,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {identity?.name ? identity.name : formatAddress(account)}
                </Box>
              </Heading>
              <ExplorerTooltip
                content={`${copied ? "Copied" : "Copy address to clipboard"}`}
              >
                <Flex
                  as="button"
                  type="button"
                  aria-label="Copy address to clipboard"
                  onClick={handleCopy}
                  css={{
                    marginLeft: "$2",
                    cursor: "pointer",
                    borderRadius: 1000,
                    backgroundColor: "$neutral3",
                    border: "1px solid $neutral6",
                    padding: 0,
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {copied ? (
                    <Box
                      as={CheckIcon}
                      css={{
                        width: 14,
                        height: 14,
                        color: "$muted",
                      }}
                    />
                  ) : (
                    <Box
                      as={CopyIcon}
                      css={{
                        width: 14,
                        height: 14,
                        color: "$muted",
                      }}
                    />
                  )}
                </Flex>
              </ExplorerTooltip>
              {isOrchestrator && (
                <ExplorerTooltip content="Get alerts">
                  <Flex
                    as="button"
                    type="button"
                    aria-label="Get orchestrator alerts"
                    onClick={() => setAlertsOpen(true)}
                    css={{
                      marginLeft: "$2",
                      cursor: "pointer",
                      borderRadius: 1000,
                      backgroundColor: "$neutral3",
                      border: "1px solid $neutral6",
                      padding: 0,
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      color: "$muted",
                      "&:hover": {
                        color: "white",
                      },
                    }}
                  >
                    <LuBell size={14} />
                  </Flex>
                </ExplorerTooltip>
              )}
            </Flex>
            {isMyAccount && (
              <Box
                css={{
                  width: "100%",
                  "@bp2": {
                    width: "auto",
                  },
                }}
              >
                <EditProfile />
              </Box>
            )}
          </Flex>
          <Flex align="center" css={{ flexWrap: "wrap" }}>
            {identity?.url && (
              <A
                variant="contrast"
                css={{ fontSize: "$2" }}
                href={identity.url}
                target="__blank"
                rel="noopener noreferrer"
              >
                <Flex
                  align="center"
                  css={{ marginTop: "$2", marginRight: "$3" }}
                >
                  <Box as={GlobeIcon} css={{ marginRight: "$1" }} />
                  {identity.url.replace(/(^\w+:|^)\/\//, "")}
                </Flex>
              </A>
            )}

            {identity?.twitter && (
              <A
                variant="contrast"
                css={{ fontSize: "$2" }}
                href={`https://twitter.com/${identity.twitter}`}
                target="__blank"
                rel="noopener noreferrer"
              >
                <Flex
                  align="center"
                  css={{ marginTop: "$2", marginRight: "$3" }}
                >
                  <Box as={TwitterLogoIcon} css={{ marginRight: "$1" }} />
                  <Box
                    css={{
                      "@media (max-width: 400px)": {
                        display: "none",
                      },
                    }}
                  >
                    @{identity.twitter}
                  </Box>
                </Flex>
              </A>
            )}

            {identity?.github && (
              <A
                variant="contrast"
                css={{ fontSize: "$2" }}
                href={`https://github.com/${identity.github}`}
                target="__blank"
                rel="noopener noreferrer"
              >
                <Flex
                  align="center"
                  css={{ marginTop: "$2", marginRight: "$3" }}
                >
                  <Box as={GitHubLogoIcon} css={{ marginRight: "$1" }} />
                  <Box
                    css={{
                      "@media (max-width: 400px)": {
                        display: "none",
                      },
                    }}
                  >
                    {identity.github}
                  </Box>
                </Flex>
              </A>
            )}
          </Flex>
        </Flex>
      </Flex>

      {identity?.description && (
        <Text css={{ marginTop: "$4", marginBottom: "$4" }}>
          <ShowMoreRichText lines={3}>
            <Box
              css={{ a: { color: "$primary11" } }}
              dangerouslySetInnerHTML={{
                __html: identity.description,
              }}
            />
          </ShowMoreRichText>
        </Text>
      )}

      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent
          css={{
            maxWidth: 400,
            width: "calc(100vw - 32px)",
            padding: "$4",
            paddingRight: "$5",
            "@bp2": {
              padding: "$5",
              paddingRight: "$6",
            },
          }}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          placeholder={undefined}
        >
          <DialogTitle asChild>
            <Text
              as="h2"
              css={{
                fontWeight: 600,
                fontSize: "$4",
                marginBottom: "$3",
                lineHeight: 1.3,
              }}
            >
              Get Orchestrator Alerts
            </Text>
          </DialogTitle>
          <Text
            css={{
              marginBottom: "$3",
              color: "$neutral11",
              lineHeight: 1.5,
            }}
          >
            Get notified about reward calls, missed rounds, and cut changes via
            our Telegram bot. Native notifications are coming soon.
          </Text>
          <Text
            css={{
              fontSize: "$2",
              color: "$neutral11",
              marginBottom: "$2",
            }}
          >
            Send this command to the bot:
          </Text>
          <Box
            as="button"
            type="button"
            onClick={handleCopyCommand}
            css={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "$2",
              width: "100%",
              background: "$neutral3",
              border: "1px solid $neutral5",
              borderRadius: "$2",
              padding: "$2 $3",
              marginBottom: "$4",
              fontFamily: "monospace",
              fontSize: "$1",
              color: "white",
              wordBreak: "break-all",
              lineHeight: 1.4,
              cursor: "pointer",
              textAlign: "left",
              "&:hover": {
                background: "$neutral5",
              },
            }}
          >
            <span>/subscribe {account}</span>
            <Box
              as={commandCopied ? CheckIcon : CopyIcon}
              css={{
                flexShrink: 0,
                width: 14,
                height: 14,
                marginTop: 2,
                color: commandCopied ? "$primary11" : "$neutral9",
              }}
            />
          </Box>
          <Button
            as="a"
            href="https://t.me/OrchestratorWatcherBot"
            target="_blank"
            rel="noopener noreferrer"
            size="3"
            variant="primary"
            css={{
              width: "100%",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            Open Telegram Bot
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Index;
