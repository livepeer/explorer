import { Box, keyframes } from "@livepeer/design-system";

const face = "#4a524e";
const lowLight = "#111";
const side = "#252a27";
const sideDark = "#120e08";
const coinSize = "7rem";

const spin = keyframes({
  "0%": {
    width: coinSize,
    boxShadow: `0 0 0 ${sideDark}`,
    animationTimingFunction: "ease-in",
  },
  "49.999%": {
    width: "0.1rem",
    boxShadow: `0.05rem 0 0 ${side}, 0.1rem 0 0 ${side}, 0.15rem 0 0 ${side},0.2rem 0 0 ${side},0.25rem 0 0 ${side},0.3rem 0 0 ${side},0.35rem 0 0 ${side},0.4rem 0 0 ${side},0.45rem 0 0 ${side},0.5rem 0 0 ${side},0.55rem 0 0 ${side},0.6rem 0 0 ${side},0.65rem 0 0 ${side},0.7rem 0 0 ${side},0.75rem 0 0 ${side}`,
    transform: "translateX(-0.375rem)",
    backgroundColor: lowLight,
    animationTimingFunction: "linear",
  },

  "50.001%": {
    width: "0.1rem",
    boxShadow: `-0.05rem 0 0 ${side},-0.1rem 0 0 ${side},-0.15rem 0 0 ${side},-0.2rem 0 0 ${side},-0.25rem 0 0 ${side},-0.3rem 0 0 ${side},-0.35rem 0 0 ${side},-0.4rem 0 0 ${side},-0.45rem 0 0 ${side},-0.5rem 0 0 ${side},-0.55rem 0 0 ${side},-0.6rem 0 0 ${side},-0.65rem 0 0 ${side},-0.7rem 0 0 ${side},-0.75rem 0 0 ${side}`,
    transform: "translateX(0.375rem)",
    backgroundColor: "${side}",
    animationTimingFunction: "ease-out",
  },
  "100%": {
    width: coinSize,
    boxShadow: `0 0 0 ${sideDark}`,
  },
});

const AnimatedToken = () => {
  return (
    <Box css={{ transform: "scale(0.4)", transformOrigin: "left" }}>
      <Box
        css={{
          ".coin": {
            height: coinSize,
            width: coinSize,
            margin: "0.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          },

          ".coin::before": {
            content: '""',
            display: "block",
            position: "relative",
            height: coinSize,
            width: coinSize,
            borderRadius: "50%",
            backgroundColor: face,
            animation: `${spin} 1s linear infinite`,
            backgroundImage: "url('/img/logos/logo.png')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
          },

          ".coin.copper::before": {
            animationDelay: "-0.25s",
          },
        }}
      >
        <Box className="coin copper" />
      </Box>
    </Box>
  );
};

export default AnimatedToken;
