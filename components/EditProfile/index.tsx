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
} from "@jjasonn.stone/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";

const Index = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            css={{ 
              color: "$green11",
              mt: "2px", 
              ml: "$3",
              fontSize: "$1",
              br: "$2",
              bc: "$green4",
              "&:hover": {
                bc: "$green6",
                opacity: 0.7
              }
            }} 
            size="1"
          >
            Edit Profile
          </Button>
        </DialogTrigger>
        <DialogContent
          css={{ overflow: "scroll" }}
        >
          <DialogTitle asChild>
            <Heading
              size="2"
              css={{ mb: "$4", display: "flex", alignitems: "center" }}
            >
              Edit Profile
            </Heading>
          </DialogTitle>
          <Text variant="neutral" css={{ mb: "$3" }}>
            Profile content is automatically pulled from publicly available
            information provided through Ethereum Name Service (ENS). Connect to
            the{" "}
            <A css={{ color: "$green11" }} href="https://ens.domains">
              ENS Manager
            </A>{" "}
            to register a .eth name and profile information such as a
            description, avatar, website, and more.
          </Text>{" "}
          <Text variant="neutral" css={{ mb: "$5" }}>
            New to ENS? Check out this{" "}
            <A
              css={{ color: "$green11" }}
              target="_blank"
              href="https://medium.com/the-ethereum-name-service/step-by-step-guide-to-registering-a-eth-name-on-the-new-ens-registrar-c07d3ab9d6a6"
            >
              step-by-step guide
            </A>{" "}
            to registering a .eth name.
          </Text>
          <Flex align="center" justify="end">
            <DialogClose asChild>
              <Button size="4" ghost css={{ color: "$gray11", fontSize: "$4", mr: "$2",
                "&:hover": {
                  opacity: 0.7
                } }}>
                Dismiss
              </Button>
            </DialogClose>
            <Button
              size="4"
              css={{
                color: "$green11",
                br: "$4",
                fontSize: "$4",
                bc: "$green4",
                "&:hover": {
                  bc: "$green6",
                  opacity: 0.7
                },
                alignItems: "center",
                display: "flex",
                textDecoration: "none"
              }}
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
              <Box css={{ ml: "$1" }} as={ArrowTopRightIcon} />
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
