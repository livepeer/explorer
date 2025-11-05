import {
  Dialog,
  DialogContent,
  DialogTitle,
  Heading,
  Box,
  Flex,
  Button,
  Text,
  Link as A,
  DialogTrigger,
  DialogClose,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";

const Index = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button css={{ marginTop: "3px", marginLeft: "$3" }} variant="primary" size="1">
            Edit Profile
          </Button>
        </DialogTrigger>
        <DialogContent
          css={{ overflow: "scroll" }}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          placeholder={undefined}
        >
          <DialogTitle asChild>
            <Heading
              size="2"
              css={{ mb: "$4", display: "flex", alignitems: "center" }}
            >
              Edit Profile
            </Heading>
          </DialogTitle>
          <Text variant="neutral" css={{ marginBottom: "$3" }}>
            Profile content is automatically pulled from publicly available
            information provided through Ethereum Name Service (ENS). Connect to
            the{" "}
            <A variant="primary" href="https://ens.domains">
              ENS Manager
            </A>{" "}
            to register a .eth name and profile information such as a
            description, avatar, website, and more.
          </Text>{" "}
          <Text variant="neutral" css={{ marginBottom: "$5" }}>
            New to ENS? Check out this{" "}
            <A
              variant="primary"
              target="_blank"
              href="https://medium.com/the-ethereum-name-service/step-by-step-guide-to-registering-a-eth-name-on-the-new-ens-registrar-c07d3ab9d6a6"
            >
              step-by-step guide
            </A>{" "}
            to registering a .eth name.
          </Text>
          <Flex align="center" justify="end">
            <DialogClose asChild>
              <Button size="4" ghost css={{ marginRight: "$2" }}>
                Dismiss
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="4"
              css={{ alignItems: "center", display: "flex" }}
            >
              <A
                href="https://ens.domains"
                target="_blank"
                css={{
                  color: "inherit",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "none",
                  },
                }}
              >
                ENS Manager
              </A>
              <Box css={{ marginLeft: "$1" }} as={ArrowTopRightIcon} />
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
