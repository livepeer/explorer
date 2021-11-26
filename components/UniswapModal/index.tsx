import { useApolloClient, useQuery, gql } from "@apollo/client";
import { Cross1Icon } from "@modulz/radix-icons";
import {
  Box,
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogContent,
} from "@livepeer/design-system";

const Index = ({ trigger, children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent css={{ width: "100%", maxWidth: 500, height: "80vh" }}>
        <DialogClose asChild>
          <Box
            as={Cross1Icon}
            css={{
              cursor: "pointer",
              position: "fixed",
              right: 20,
              top: 20,
              zIndex: 1000,
              color: "white",
            }}
          />
        </DialogClose>

        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Index;
