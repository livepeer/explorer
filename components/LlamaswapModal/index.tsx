import { Dialog, DialogContent, DialogTrigger } from "@livepeer/design-system";

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
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Index;
