import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
  TextArea,
  Card,
} from "@livepeer/design-system";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import { useState } from "react";
import { useAccountAddress } from "hooks";
import { useWalletClient } from "wagmi";
import { createSnapshotProposal } from "@lib/api/snapshot";

const CreateSnapshot = () => {
  const accountAddress = useAccountAddress();
  const { data: walletClient } = useWalletClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [choices, setChoices] = useState("For\nAgainst\nAbstain");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletClient || !accountAddress) {
      setError("Please connect your wallet");
      return;
    }

    if (!title || !body || !startDate || !endDate) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const choicesArray = choices.split("\n").filter(c => c.trim());
      
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      const receipt = await createSnapshotProposal(
        walletClient,
        accountAddress,
        {
          title,
          body,
          choices: choicesArray,
          start: startTimestamp,
          end: endTimestamp,
        }
      );

      console.log("Proposal created:", receipt);
      setSuccess(true);
      
      // Redirect to snapshots page after a delay
      setTimeout(() => {
        window.location.href = "/snapshots";
      }, 2000);
    } catch (err) {
      console.error("Error creating snapshot:", err);
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!accountAddress) {
    return (
      <>
        <Head>
          <title>Livepeer Explorer - Create Snapshot</title>
        </Head>
        <Container
          css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", marginTop: "$6" }}
        >
          <Flex
            css={{
              width: "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
            }}
          >
            <Heading
              size="2"
              css={{
                fontWeight: 700,
                marginBottom: "$4",
                textAlign: "center",
              }}
            >
              Create Snapshot
            </Heading>
            <Text size="3" variant="neutral">
              Please connect your wallet to create a snapshot proposal.
            </Text>
          </Flex>
        </Container>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Livepeer Explorer - Create Snapshot</title>
        </Head>
        <Container
          css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", marginTop: "$6" }}
        >
          <Flex
            css={{
              width: "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
            }}
          >
            <Heading
              size="2"
              css={{
                fontWeight: 700,
                marginBottom: "$4",
                textAlign: "center",
                color: "$green11",
              }}
            >
              Snapshot Created Successfully!
            </Heading>
            <Text size="3" variant="neutral">
              Redirecting to snapshots page...
            </Text>
          </Flex>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Create Snapshot</title>
      </Head>
      <Container
        css={{ maxWidth: 800, width: "100%", marginTop: "$6", marginBottom: "$6" }}
      >
        <Heading
          size="2"
          css={{
            fontWeight: 700,
            marginBottom: "$4",
          }}
        >
          Create Snapshot
        </Heading>

        <form onSubmit={handleSubmit}>
          <Card
            css={{
              padding: "$4",
              marginBottom: "$4",
              border: "1px solid $neutral4",
            }}
          >
            <Box css={{ marginBottom: "$4" }}>
              <Text
                size="2"
                css={{ marginBottom: "$2", display: "block", fontWeight: 600 }}
              >
                Title *
              </Text>
              <TextField
                size="3"
                placeholder="Enter proposal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                css={{ width: "100%" }}
              />
            </Box>

            <Box css={{ marginBottom: "$4" }}>
              <Text
                size="2"
                css={{ marginBottom: "$2", display: "block", fontWeight: 600 }}
              >
                Description *
              </Text>
              <TextArea
                size="3"
                placeholder="Enter proposal description (supports Markdown)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                css={{ width: "100%", minHeight: 200 }}
              />
            </Box>

            <Box css={{ marginBottom: "$4" }}>
              <Text
                size="2"
                css={{ marginBottom: "$2", display: "block", fontWeight: 600 }}
              >
                Choices (one per line) *
              </Text>
              <TextArea
                size="3"
                placeholder="For&#10;Against&#10;Abstain"
                value={choices}
                onChange={(e) => setChoices(e.target.value)}
                required
                css={{ width: "100%", minHeight: 100 }}
              />
            </Box>

            <Flex css={{ gap: "$4", marginBottom: "$4" }}>
              <Box css={{ flex: 1 }}>
                <Text
                  size="2"
                  css={{ marginBottom: "$2", display: "block", fontWeight: 600 }}
                >
                  Start Date *
                </Text>
                <TextField
                  size="3"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  css={{ width: "100%" }}
                />
              </Box>

              <Box css={{ flex: 1 }}>
                <Text
                  size="2"
                  css={{ marginBottom: "$2", display: "block", fontWeight: 600 }}
                >
                  End Date *
                </Text>
                <TextField
                  size="3"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  css={{ width: "100%" }}
                />
              </Box>
            </Flex>

            {error && (
              <Box
                css={{
                  padding: "$3",
                  marginBottom: "$4",
                  backgroundColor: "$red3",
                  border: "1px solid $red7",
                  borderRadius: "$2",
                }}
              >
                <Text size="2" css={{ color: "$red11" }}>
                  {error}
                </Text>
              </Box>
            )}

            <Button
              size="3"
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              css={{ width: "100%" }}
            >
              {isSubmitting ? "Creating Snapshot..." : "Create Snapshot"}
            </Button>
          </Card>

          <Card
            css={{
              padding: "$3",
              backgroundColor: "$neutral3",
              border: "1px solid $neutral4",
            }}
          >
            <Text size="2" variant="neutral">
              <strong>Note:</strong> Creating a snapshot requires signing with your
              connected wallet. Make sure you have sufficient voting power in the
              Livepeer protocol.
            </Text>
          </Card>
        </form>
      </Container>
    </>
  );
};

CreateSnapshot.getLayout = getLayout;

export default CreateSnapshot;
