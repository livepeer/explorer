import {
  Box,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@livepeer/design-system";
import { Cross1Icon } from "@modulz/radix-icons";

const Index = ({ trigger, children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        css={{ width: "100%", maxWidth: 500, height: "80vh" }}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        placeholder={undefined}
      >
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
