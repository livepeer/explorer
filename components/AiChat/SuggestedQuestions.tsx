import { Box, Flex, Text } from "@livepeer/design-system";

const suggestions = [
  "Who are the top orchestrators by stake?",
  "What's the current round number?",
  "What are the current protocol stats?",
  "Which orchestrators support AI pipelines?",
];

export default function SuggestedQuestions({
  onSelect,
}: {
  onSelect: (question: string) => void;
}) {
  return (
    <Box css={{ padding: "$3" }}>
      <Text
        variant="neutral"
        size="1"
        css={{ marginBottom: "$2", display: "block" }}
      >
        Try asking:
      </Text>
      <Flex css={{ flexDirection: "column", gap: "$2" }}>
        {suggestions.map((q) => (
          <Box
            key={q}
            onClick={() => onSelect(q)}
            css={{
              padding: "$2 $3",
              borderRadius: "$2",
              border: "1px solid $neutral6",
              cursor: "pointer",
              transition: "background-color 0.15s",
              "&:hover": {
                backgroundColor: "$neutral3",
              },
            }}
          >
            <Text size="2">{q}</Text>
          </Box>
        ))}
      </Flex>
    </Box>
  );
}
