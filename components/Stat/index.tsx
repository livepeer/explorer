import { ExplorerTooltip } from "@components/ExplorerTooltip";
import {
  Heading,
  Text,
  Card,
  Box,
  Flex,
  Skeleton,
} from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { ReactNode } from "react";

type Props = {
  label: ReactNode;
  meta?: ReactNode;
  tooltip?: ReactNode;
  value?: ReactNode | null;
  variant?: "ghost" | "interactive" | "active";
  css?: object;
  className?: string;
};
const Stat = ({
  label,
  value,
  meta,
  tooltip,
  variant = "active",
  css = null,
  className = null,
}: Props) => (
  <Card
    variant={variant}
    className={className}
    css={{
      color: "$neutral9",
      p: "$3",
      boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
      ...css,
    }}
  >
    <Heading
      css={{
        fontSize: "$2",
        color: "$neutral9",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      <Flex css={{ ai: "center" }}>
        {label}
        {tooltip && (
          <ExplorerTooltip multiline content={<Box>{tooltip}</Box>}>
            <Flex css={{ ml: "$1" }}>
              <Box as={QuestionMarkCircledIcon} css={{ color: "$neutral11" }} />
            </Flex>
          </ExplorerTooltip>
        )}
      </Flex>
    </Heading>
    <Text size="7" css={{ fontWeight: 600 }}>
      {value ? value : <Skeleton css={{ mt: "$1", height: 35, width: 100 }} />}
    </Text>
    {meta && meta}
  </Card>
);

export default Stat;
