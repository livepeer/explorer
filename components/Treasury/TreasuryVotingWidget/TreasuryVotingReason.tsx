import { Box, Text, TextArea } from "@livepeer/design-system";

const MAX_INPUT_LENGTH = 256;
const MIN_INPUT_LENGTH = 3;

/**
 * Renders an input for the reason of the vote
 * @param reason {@link string} The reason for the vote
 * @param setReason {@link function} The function to set the reason
 * @param disabled {@link boolean} Whether the input is disabled
 * @example <TreasuryVotingReason reason={reason} setReason={setReason} disabled={false} />
 */
const Index = ({
  reason,
  setReason,
  disabled,
}: {
  disabled?: boolean;
  reason: string;
  setReason: (reason: string) => void;
}) => {
  const charsLeft = MAX_INPUT_LENGTH - reason.length;

  return (
    <Box css={{ marginTop: "$2" }}>
      <Text
        size="2"
        css={{
          fontWeight: 600,
          display: "block",
          marginBottom: "$2",
          color: "$hiContrast",
        }}
      >
        Reason (optional)
      </Text>
      <TextArea
        css={{
          borderRadius: "$2",
          fontSize: "$2",
          padding: "$3",
          width: "100%",
          backgroundColor: "$neutral3",
          border: "1px solid $neutral4",
          "&:focus": {
            outline: "none",
            borderColor: "$neutral6",
          },
        }}
        placeholder="Please provide reasoning behind your vote..."
        value={reason}
        typeof="text"
        disabled={disabled}
        maxLength={MAX_INPUT_LENGTH}
        minLength={MIN_INPUT_LENGTH}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
      />
      <Text
        css={{
          fontSize: "$1",
          marginTop: "$1",
          color: "$neutral11",
        }}
      >
        {charsLeft} characters left
      </Text>
    </Box>
  );
};

export default Index;
