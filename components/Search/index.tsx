import Router from "next/router";
import Box from "../Box";
import { MagnifyingGlassIcon } from "@modulz/radix-icons";
import Button from "../Button";
import { TextField } from "@livepeer/design-system";

function handleSubmit(e) {
  e.preventDefault();
  const [, input] = e.target.children;
  Router.push(
    `/accounts/[account]/[slug]`,
    `/accounts/${input.value}/delegating`
  );
}

const Index = ({ css = {}, ...props }) => {
  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      css={{
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        width: "320px",
        position: "relative",
        ...css,
      }}
      {...props}
    >
      <Button
        css={{
          cursor: "pointer",
          position: "absolute",
          right: "$2",
          mr: "$1",
          display: "flex",
          alignItems: "center",
          bc: "transparent",
          p: 0,
          "&:hover": {
            svg: {
              transition: ".15s color",
              color: "$hiContrast",
            },
          },
        }}
        type="submit"
      >
        <Box
          as={MagnifyingGlassIcon}
          css={{
            transition: ".15s color",
            width: 18,
            height: 18,
            color: "$neutral9",
            bc: "transparent",
          }}
        />
      </Button>
      <TextField
        placeholder="Search Orchestrators & Delegators"
        type="search"
        size="2"
        css={{ pr: "$7" }}
      />
    </Box>
  );
};
export default Index;
