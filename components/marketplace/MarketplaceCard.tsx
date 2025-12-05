import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";

import { EcosystemItem } from "../../data/ecosystem";

const cardBase = {
  border: "1px solid $neutral6",
  borderRadius: "$5",
  padding: "$6",
  backgroundColor: "rgba(6,8,10,0.7)",
  display: "flex",
  flexDirection: "column",
  gap: "$3",
  height: "100%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s",
  "&:hover": {
    transform: "translateY(-2px)",
    borderColor: "rgba(16,185,129,0.6)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
  },
};

const MarketplaceCard = ({ item }: { item: EcosystemItem }) => {
  const isMediaApi = item.type === "media_api";
  const primaryCta = isMediaApi
    ? item.docsUrl || item.playgroundUrl
    : item.url || item.docsUrl || item.githubUrl;
  const secondaryCta = isMediaApi
    ? item.playgroundUrl
    : item.docsUrl || item.githubUrl;
  const description = item.description;

  return (
    <Box css={cardBase}>
      <Flex css={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box
          css={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: isMediaApi
              ? "linear-gradient(135deg, rgba(16,185,129,0.35), rgba(59,130,246,0.2))"
              : "linear-gradient(135deg, rgba(0,255,165,0.25), rgba(97,218,250,0.16))",
            display: "grid",
            placeItems: "center",
            color: "$hiContrast",
            fontWeight: 700,
            fontSize: "$4",
            textTransform: "uppercase",
          }}
        >
          {isMediaApi ? "API" : (item.name[0] ?? "").slice(0, 1)}
        </Box>
        <Flex css={{ gap: "$2", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {item.featured && (
            <Badge variant="green" size="2">
              Featured
            </Badge>
          )}
        </Flex>
      </Flex>
      <Box>
        <Flex css={{ alignItems: "center", gap: "$2", marginBottom: "$1" }}>
          <Heading size="4" css={{ marginBottom: 0, color: "$hiContrast" }}>
            {item.name}
          </Heading>
          <Text
            css={{
              fontSize: "$1",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isMediaApi ? "$green11" : "$neutral10",
            }}
          >
            {isMediaApi ? "API" : "Application"}
          </Text>
          {item.status && (
            <Text
              css={{
                fontSize: "$1",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:
                  item.status === "live"
                    ? "$green11"
                    : item.status === "beta"
                    ? "$amber11"
                    : "$neutral10",
              }}
            >
              {item.status}
            </Text>
          )}
        </Flex>
        <Text
          variant="neutral"
          css={{ lineHeight: "1.6", color: "$neutral11" }}
        >
          {description}
        </Text>
        {isMediaApi && item.apiEndpointExample && (
          <Box
            css={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: "$2",
              padding: "6px 10px",
              borderRadius: "$pill",
              border: "1px solid rgba(16,185,129,0.4)",
              color: "$hiContrast",
              backgroundColor: "rgba(16,185,129,0.12)",
              fontSize: "$2",
              fontWeight: 600,
            }}
          >
            API: {item.apiEndpointExample}
          </Box>
        )}
      </Box>
      <Flex css={{ gap: "$2", flexWrap: "wrap" }}>
        {item.tags.slice(0, 3).map((tag) => (
          <Box
            key={tag}
            css={{
              fontSize: "11px",
              color: "$neutral10",
              backgroundColor: "$neutral3",
              border: "1px solid $neutral6",
              padding: "4px 8px",
              borderRadius: "$pill",
            }}
          >
            {tag}
          </Box>
        ))}
        {item.tags.length > 3 && (
          <Box
            css={{
              fontSize: "11px",
              color: "$neutral10",
              backgroundColor: "$neutral3",
              border: "1px solid $neutral6",
              padding: "4px 8px",
              borderRadius: "$pill",
            }}
          >
            +{item.tags.length - 3}
          </Box>
        )}
      </Flex>
      <Flex
        css={{
          gap: "$2",
          marginTop: "auto",
          flexWrap: "wrap",
        }}
      >
        {primaryCta && (
          <Button
            as="a"
            href={primaryCta}
            target={primaryCta.startsWith("http") ? "_blank" : undefined}
            rel={primaryCta.startsWith("http") ? "noreferrer" : undefined}
            size="2"
          >
            {isMediaApi ? "View docs" : "Visit"}
          </Button>
        )}
        {secondaryCta && (
          <Button
            as="a"
            href={secondaryCta}
            target={secondaryCta.startsWith("http") ? "_blank" : undefined}
            rel={secondaryCta.startsWith("http") ? "noreferrer" : undefined}
            size="2"
            variant="transparentBlack"
          >
            {isMediaApi ? "Open dashboard" : "Docs"}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default MarketplaceCard;
