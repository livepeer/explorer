import { EnsIdentity } from "@lib/api/types/get-ens";
import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { Box, Flex, Heading, Link as A, Text } from "@livepeer/design-system";
import {
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  TwitterLogoIcon,
  GitHubLogoIcon,
} from "@modulz/radix-icons";
import QRCode from "qrcode.react";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ShowMoreText from "react-show-more-text";
import EditProfile from "../EditProfile";

interface Props {
  account: string;
  isActive: boolean;
  isMyAccount: boolean;
  css?: object;
  identity: EnsIdentity;
}

const Index = ({ account, isMyAccount = false, identity }: Props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  return (
    <Box css={{ marginBottom: "$3" }}>
      <Flex css={{ alignItems: "center" }}>
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
                <QRCode
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
          css={{ height: "100%", marginLeft: "$3" }}
        >
          <Flex css={{ alignItems: "center" }}>
            <CopyToClipboard text={account} onCopy={() => setCopied(true)}>
              <Heading
                size="2"
                css={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                }}
              >
                {identity?.name
                  ? identity.name
                  : account.replace(account.slice(5, 39), "…")}
                <ExplorerTooltip
                  content={`${copied ? "Copied" : "Copy address to clipboard"}`}
                >
                  <Flex
                    css={{
                      marginLeft: "$3",
                      marginTop: "3px",
                      cursor: "pointer",
                      borderRadius: 1000,
                      backgroundColor: "$neutral3",
                      border: "1px solid $neutral6",
                      width: 28,
                      height: 28,
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
              </Heading>
            </CopyToClipboard>
            {isMyAccount && <EditProfile />}
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
                <Flex align="center" css={{ marginTop: "$2", marginRight: "$3" }}>
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
                <Flex align="center" css={{ marginTop: "$2", marginRight: "$3" }}>
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
                <Flex align="center" css={{ marginTop: "$2", marginRight: "$3" }}>
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
          <ShowMoreText
            lines={3}
            more={
              <Box as="span" css={{ color: "$primary11" }}>
                Show more
              </Box>
            }
            less={
              <Box as="span" css={{ color: "$primary11" }}>
                Show Less
              </Box>
            }
          >
            <Box
              css={{ a: { color: "$primary11" } }}
              dangerouslySetInnerHTML={{
                __html: identity.description,
              }}
            />
          </ShowMoreText>
        </Text>
      )}
    </Box>
  );
};

export default Index;
