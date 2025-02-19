import { Cross1Icon } from "@modulz/radix-icons";
import {
  Box,
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogContent,
} from "@jjasonn.stone/design-system";

interface Props {
  trigger: React.ReactNode;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const Index = ({ trigger, children, showCloseButton = true }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent css={{ width: "100%", maxWidth: 500, height: "80vh" }}>
        {showCloseButton && (
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
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Index;
