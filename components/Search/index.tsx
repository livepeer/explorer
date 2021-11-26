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

const Index = ({ ...props }) => {
  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      css={{
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        width: "400px",
        position: "relative",
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
          backgroundColor: "transparent",
          p: 0,
        }}
        type="submit"
      >
        <Box
          as={MagnifyingGlassIcon}
          css={{
            width: 20,
            height: 20,
            color: "$muted",
            bc: "transparent",
          }}
        />
      </Button>
      <TextField
        placeholder="Search Orchestrators & Delegators"
        type="search"
        size="2"
      />
    </Box>
  );
};
export default Index;
