import { useState } from "react";
import { ThreeBoxSpace } from "../../@types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Heading,
  Box,
  Flex,
  Button,
  Text,
} from "@livepeer/design-system";

interface Props {
  account: string;
  threeBoxSpace?: ThreeBoxSpace;
}

const Index = ({ threeBoxSpace }: Props) => {
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  if (!threeBoxSpace.defaultProfile) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setEditProfileOpen(true)}
        css={{ mt: "3px", ml: "$3" }}
        variant="primary"
        size="1"
      >
        Edit Profile
      </Button>

      <Dialog open={editProfileOpen}>
        <DialogContent css={{ overflow: "scroll" }}>
          <DialogTitle asChild>
            <Heading size="2" css={{ mb: "$4" }}>
              Edit Profile
            </Heading>
          </DialogTitle>

          <Text variant="neutral" css={{ mb: "$3" }}>
            The offchain identity solution, 3box, used by the Livepeer Explorer
            for custom profile support has been sunsetted by 3box Labs. We are
            actively working on adding support for ENS and Ceramic as a
            replacement moving forward. Stay tuned.
          </Text>

          <Box>
            <Flex css={{ justifyContent: "flex-end" }}>
              <Button
                size="4"
                variant="ghost"
                onClick={() => setEditProfileOpen(false)}
              >
                Dismiss
              </Button>
            </Flex>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
