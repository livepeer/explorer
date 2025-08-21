import React from "react";
import { Box } from "@livepeer/design-system";

interface Props {
  open?: boolean;
  label: React.ReactNode;
  button?: React.ReactNode;
  css?: object;
}

const Index = ({ css = {}, open = true, label, button }: Props) =>
  !open ? null : (
    <Box
      css={{
        borderRadius: "$6",
        border: "1px solid",
        borderColor: "$border",
        width: "100%",
        padding: "$3",
        fontSize: "$2",
        ...css,
      }}
    >
      <Box>
        {label}
        {button && button}
      </Box>
    </Box>
  );

export default Index;
