import { Card, Box } from "@livepeer/design-system";

const Option = ({
  link = null,
  clickable = true,
  onClick = null,
  color,
  header,
  subheader = null,
  Icon = null,
  active = false,
  ...props
}) => {
  const content = (
    <Card
      onClick={onClick}
      css={{
        backgroundColor: active ? "$neutral5" : "$neutral3",
        cursor: clickable ? "pointer" : "default",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid",
        borderColor: active ? "$neutral10" : "$neutral6",
        position: "relative",
        p: "$3",
        "&:hover": {
          borderColor: "$primary10",
        },
      }}
      {...props}
    >
      <Box css={{ textAlign: "center" }}>
        {Icon && (
          <Icon
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              left: 20,
              position: "absolute",
              width: 22,
              height: 22,
            }}
          />
        )}
        <Box>
          <Box>{header}</Box>
          {subheader && (
            <Box css={{ mt: "$2", fontSize: "$1" }}>{subheader}</Box>
          )}
        </Box>
      </Box>
    </Card>
  );

  if (link) {
    return (
      <Box as="a" target="__blank" href={link} css={{ color: "white" }}>
        {content}
      </Box>
    );
  }
  return content;
};

export default Option;
