import { Heading, Text, Card } from "@livepeer/design-system";
import { ReactNode } from "react";

type Props = {
  label: ReactNode;
  meta?: ReactNode;
  value: ReactNode;
  variant?: "ghost" | "interactive" | "active";
  css?: object;
  className?: string;
};
const Stat = ({
  label,
  value,
  meta,
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
      {label}
    </Heading>
    <Text size="7" css={{ fontWeight: 600 }}>
      {value}
    </Text>
    {meta && meta}
  </Card>
);

export default Stat;
