
import { Text, TextArea } from "@livepeer/design-system";

const MAX_INPUT_LENGTH = 256;
const MIN_INPUT_LENGTH = 1;

/**
 * 
 * @param reason {@link string} The reason for the vote
 * @param setReason {@link function} The function to set the reason
 * @param disabled {@link boolean} Whether the input is disabled
 * @returns  {@link JSX.Element} The input for the reason
 * @description A component that renders an input for the reason of the vote
 * @example
 * <TreasuryVotingReason reason={reason} setReason={setReason} disabled={false} />
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


  return (
    <>
      <Text size="2" css={{ fontWeight: 600, marginBottom: "$1" }}>
        Reason (optional)
      </Text>
      <TextArea
        css={{
          borderRadius: "$2",
          fontSize: "$2",
          paddingRight: "$3",
          paddingLeft: "$3",
          width: "100%",
        }}
        placeholder="Please provide reasoning behind your vote..."
        value={reason}
        typeof="text"
        disabled={disabled}
        maxLength={MAX_INPUT_LENGTH}
        minLength={MIN_INPUT_LENGTH}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />
     </>
  );
};

export default Index;