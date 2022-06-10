import Spinner from "@components/Spinner";
import dayjs from "dayjs";
import { getLayout, LAYOUT_MAX_WIDTH } from "../layouts/main";
import Markdown from "markdown-to-jsx";
import { createApolloFetch } from "apollo-fetch";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  Box,
  Flex,
  Card,
  Container,
  Badge,
  Heading,
} from "@livepeer/design-system";

const query = `
  {
    projectBySlugs(organizationSlug: "livepeer", projectSlug: "explorer") {
      name
      releases {
        edges {
          node {
            title
            description
            isPublished
            publishedAt
            changes {
              type
              content
            }
          }
        }
      }
    }
  }
`;

function getBadgeColor(changeType) {
  if (changeType === "NEW") {
    return "green";
  } else if (changeType === "IMPROVED") {
    return "teal";
  } else if (changeType === "FIXED") {
    return "blue";
  } else if (changeType === "REMOVED") {
    return "red";
  } else {
    return "indigo";
  }
}

const groupBy = (key) => (array) =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

const groupByType = groupBy("type");

const WhatsNew = () => {
  const [changeFeedData, setChangeFeedData] = useState(null);

  useEffect(() => {
    const apolloFetch = createApolloFetch({
      uri: `${window.location.origin}/api/graphql`,
    });
    async function getChangefeed() {
      const { data } = await apolloFetch({ query });
      setChangeFeedData(data);
    }
    getChangefeed();
  }, []);

  return (
    <>
      <Head>
        <title>Livepeer Explorer - What&apos;s New</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        {!changeFeedData ? (
          <Flex
            css={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: "calc(100vh - 61px)",
            }}
          >
            <Spinner />
          </Flex>
        ) : (
          <>
            <Flex
              css={{
                mt: "$3",
                mb: "$4",
                width: "100%",
                flexDirection: "column",
                "@bp3": {
                  mt: "$5",
                },
              }}
            >
              <Heading
                size="3"
                as="h1"
                css={{
                  fontWeight: 700,
                  fontSize: "$3",
                  mb: "$4",
                  display: "flex",
                  alignItems: "center",
                  "@bp2": {
                    fontSize: "$5",
                  },
                  "@bp3": {
                    mb: "$4",
                    fontSize: 26,
                  },
                }}
              >
                <Box as="span" css={{ mr: "$2" }}>
                  🌟
                </Box>{" "}
                What&apos;s New
              </Heading>
              <Box css={{ img: { maxWidth: "100%" } }}>
                {changeFeedData.projectBySlugs.releases.edges.map(
                  ({ node }, index1) =>
                    node.isPublished && (
                      <Card
                        key={index1}
                        css={{
                          border: "1px solid $neutral4",
                          flex: 1,
                          mb: "$5",
                          p: "$4",
                        }}
                      >
                        <Heading size="1" css={{ fontWeight: 600 }}>
                          {node.title}
                        </Heading>
                        <Box
                          css={{
                            lineHeight: 2,
                            mb: "$3",
                            fontSize: "$2",
                            color: "$neutral11",
                          }}
                        >
                          {dayjs(node.publishedAt).format("MMM Do, YYYY")}
                        </Box>
                        <Box
                          css={{
                            borderBottom: "1px solid $neutral5",
                            pb: "$4",
                            mb: "$4",
                            lineHeight: 1.5,
                            a: { color: "$primary11" },
                          }}
                        >
                          <Markdown>{node.description}</Markdown>
                        </Box>
                        {Object.keys(groupByType(node.changes)).map(
                          (key, index2) => {
                            return (
                              <Box key={index2} css={{ mb: "$3" }}>
                                <Badge
                                  variant={getBadgeColor(key)}
                                  css={{ fontWeight: 600 }}
                                >
                                  {key}
                                </Badge>
                                {groupByType(node.changes)[key].map(
                                  (change, index3) => (
                                    <Box
                                      as="ul"
                                      key={index3}
                                      css={{ pl: 20, alignSelf: "flexStart" }}
                                    >
                                      <Box
                                        as="li"
                                        css={{ mb: "$3", lineHeight: 1.5 }}
                                      >
                                        {change.content}
                                      </Box>
                                    </Box>
                                  )
                                )}
                              </Box>
                            );
                          }
                        )}
                      </Card>
                    )
                )}
              </Box>
            </Flex>
          </>
        )}
      </Container>
    </>
  );
};

WhatsNew.getLayout = getLayout;

export default WhatsNew;
