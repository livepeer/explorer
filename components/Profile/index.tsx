import { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { ThreeBoxSpace } from "../../@types";
import { CopyToClipboard } from "react-copy-to-clipboard";
import EditProfile from "../EditProfile";
import ShowMoreText from "react-show-more-text";
import Link from "next/link";
import { nl2br } from "../../lib/utils";
import { Link1Icon, CheckIcon, CopyIcon } from "@modulz/radix-icons";
import { Heading, Box, Flex, Tooltip } from "@livepeer/design-system";
interface Props {
  account: string;
  role?: string;
  isMyAccount: boolean;
  threeBoxSpace?: ThreeBoxSpace;
  css?: object;
}

const Index = ({
  account,
  role,
  isMyAccount = false,
  threeBoxSpace,
}: Props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  return (
    <Box css={{ mb: "$3" }}>
      <Box
        css={{
          width: 60,
          height: 60,
          maxWidth: 60,
          maxHeight: 60,
          position: "relative",
          mb: "$2",
          "@bp3": {
            mb: "$3",
            width: 70,
            height: 70,
            maxWidth: 70,
            maxHeight: 70,
          },
        }}
      >
        {process.env.NEXT_PUBLIC_THREEBOX_ENABLED && threeBoxSpace?.image ? (
          <Box
            as="img"
            css={{
              objectFit: "cover",
              border: "1px solid",
              borderColor: "$muted",
              padding: "4px",
              borderRadius: "$round",
              width: "100%",
              height: "100%",
            }}
            src={`https://ipfs.infura.io/ipfs/${threeBoxSpace.image}`}
          />
        ) : (
          <Box
            as={QRCode}
            style={{
              border: "1px solid",
              padding: "4px",
              borderRadius: "1000px",
              width: "inherit",
              height: "inherit",
            }}
            fgColor={`#${account.substr(2, 6)}`}
            value={account}
          />
        )}
      </Box>
      <Flex css={{ alignItems: "center", mb: "10px" }}>
        <CopyToClipboard text={account} onCopy={() => setCopied(true)}>
          <Heading
            size="2"
            css={{
              display: "flex",
              alignItems: "center",
              fontWeight: 700,
            }}
          >
            {process.env.NEXT_PUBLIC_THREEBOX_ENABLED && threeBoxSpace?.name
              ? threeBoxSpace.name
              : account.replace(account.slice(5, 39), "…")}
            <Tooltip
              content={`${copied ? "Copied" : "Copy address to clipboard"}`}
            >
              <Flex
                css={{
                  ml: "$3",
                  mt: "3px",
                  cursor: "pointer",
                  borderRadius: 1000,
                  bc: "$neutral3",
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
            </Tooltip>
          </Heading>
        </CopyToClipboard>
        {process.env.NEXT_PUBLIC_THREEBOX_ENABLED &&
          isMyAccount &&
          threeBoxSpace && (
            <EditProfile account={account} threeBoxSpace={threeBoxSpace} />
          )}
      </Flex>
      {process.env.NEXT_PUBLIC_THREEBOX_ENABLED && threeBoxSpace?.website && (
        <Flex css={{ mb: "$4", alignItems: "center" }}>
          <Box as={Link1Icon} css={{ color: "$muted", mr: "$2" }} />
          <Box
            as="a"
            css={{ fontSize: "$2", color: "$primary" }}
            href={threeBoxSpace.website}
            target="__blank"
            rel="noopener noreferrer"
          >
            {threeBoxSpace.website.replace(/(^\w+:|^)\/\//, "")}
          </Box>
        </Flex>
      )}

      {process.env.NEXT_PUBLIC_THREEBOX_ENABLED && threeBoxSpace?.description && (
        <Box css={{ my: "$3", a: { color: "$primary" } }}>
          <ShowMoreText
            lines={3}
            more={
              <Box as="span" css={{ color: "$primary" }}>
                Show more
              </Box>
            }
            less={
              <Box as="span" css={{ color: "$primary" }}>
                Show Less
              </Box>
            }
          >
            <Box
              css={{ a: { color: "$primary" } }}
              dangerouslySetInnerHTML={{
                __html: nl2br(threeBoxSpace.description),
              }}
            />
          </ShowMoreText>
        </Box>
      )}
      {process.env.NEXT_PUBLIC_THREEBOX_ENABLED &&
        threeBoxSpace?.addressLinks &&
        threeBoxSpace?.addressLinks.length > 0 &&
        role !== "Orchestrator" && (
          <Box css={{ my: "$4" }}>
            <Box
              css={{
                display: "inline-flex",
                flexDirection: "column",
                p: "14px",
                borderRadius: 10,
                border: "1px dashed",
                borderColor: "$border",
              }}
            >
              <Box
                css={{
                  mb: "6px",
                  fontWeight: 600,
                  fontSize: "$1",
                  color: "$muted",
                }}
              >
                External Account
              </Box>
              <Flex>
                {threeBoxSpace.addressLinks.map((link, i) => (
                  <Link
                    href={`/accounts/${link.address}/orchestrating`}
                    passHref
                    key={i}
                  >
                    <Box
                      as="a"
                      css={{
                        mr:
                          threeBoxSpace.addressLinks.length - 1 === i
                            ? 0
                            : "$2",
                        borderRadius: 6,
                        display: "inline-flex",
                        bc: "$panel",
                        py: "4px",
                        px: "12px",
                        fontSize: "$1",
                        fontWeight: 600,
                        color: "$primary10",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {link.address
                        .replace(link.address.slice(10, 34), "…")
                        .toLowerCase()}
                    </Box>
                  </Link>
                ))}
              </Flex>
            </Box>
          </Box>
        )}
    </Box>
  );
};

export default Index;
