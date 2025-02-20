import {
  Dialog,
  DialogContent,
  DialogTitle,
  Heading,
  Box,
  Flex,
  Text,
  Link as A,
  DialogTrigger,
  DialogClose,
} from "@livepeer/design-system";
import { Button } from "@components/Button";
import { DialogOverlay } from "@reach/dialog";
import { ArrowTopRightIcon } from "@modulz/radix-icons";

const Index = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            size="1"
            color="green"
            css={{ mt: "3px", ml: "$3", px: "$2", br: "$2" }}
          >
            Edit Profile
          </Button>
        </DialogTrigger>

        <DialogContent css={{ 
          maxWidth: "900px",
          width: "90vw",
        }}>
          <DialogOverlay style={{
            background: 'rgba(150, 150, 150, 0.1)',
            backdropFilter: 'blur(8px)',
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}></DialogOverlay>
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
            <A  css={{ color: "$green11" }} href="https://ens.domains">
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
              <Button size="4" ghost color="secondary" css={{ mr: "$2", }}>
                Dismiss
              </Button>
            </DialogClose>
            <Button
              size="4"
              color="green"
              css={{
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
