import { Dialog, DialogContent, DialogTrigger } from "@livepeer/design-system";

const Index = ({ trigger, children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        css={{ width: "100%", maxWidth: 500, height: "80vh" }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Index;
