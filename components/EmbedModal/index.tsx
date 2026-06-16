import {
  Box,
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@livepeer/design-system";

const EmbedModal = ({ trigger, children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        css={{
          width: "100%",
          maxWidth: 500,
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          // The built-in close button is a ghost IconButton with no pointer cursor.
          "& button": { cursor: "pointer" },
        }}
      >
        {/* marginTop matches the Search dialog so the close button clears the
            embedded content (and its scrollbar) instead of overlapping it. */}
        <Box css={{ flex: 1, minHeight: 0, marginTop: "$4" }}>{children}</Box>
      </DialogContent>
    </Dialog>
  );
};

export default EmbedModal;
