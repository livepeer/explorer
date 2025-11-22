import { Theme } from "@rainbow-me/rainbowkit";

const darkGrey = "#252a27";

// TODO move this into the design system library and use variables
const rainbowTheme: Theme = {
  blurs: {
    modalOverlay: "blur(0px)",
  },
  fonts: {
    body: "Inter, -apple-system, system-ui, sans-serif",
  },
  radii: {
    actionButton: "8px",
    connectButton: "8px",
    menuButton: "8px",
    modal: "8px",
    modalMobile: "8px",
  },
  colors: {
    accentColor: "#113123",
    accentColorForeground: "#4cc38a",

    actionButtonBorder: "rgba(255, 255, 255, 0.04)",
    actionButtonBorderMobile: "rgba(255, 255, 255, 0.08)",
    actionButtonSecondaryBackground: "rgba(255, 255, 255, 0.08)",
    closeButton: "rgba(224, 232, 255, 0.6)",
    closeButtonBackground: "rgba(255, 255, 255, 0.08)",
    connectButtonBackground: darkGrey,
    connectButtonBackgroundError: "#FF494A",
    connectButtonInnerBackground:
      "linear-gradient(0deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.15))",
    connectButtonText: "#FFF",
    connectButtonTextError: "#FFF",
    connectionIndicator: "#30E000",
    downloadBottomCardBackground:
      "linear-gradient(126deg, rgba(0, 0, 0, 0) 9.49%, rgba(120, 120, 120, 0.2) 71.04%), #1A1B1F",
    downloadTopCardBackground:
      "linear-gradient(126deg, rgba(120, 120, 120, 0.2) 9.49%, rgba(0, 0, 0, 0) 71.04%), #1A1B1F",
    error: "#FF494A",
    generalBorder: "rgba(255, 255, 255, 0.08)",
    generalBorderDim: "rgba(255, 255, 255, 0.04)",
    menuItemBackground: "rgba(224, 232, 255, 0.1)",
    modalBackdrop: "rgba(0, 0, 0, 0.5)",
    modalBackground: "#1A1B1F",
    modalBorder: "rgba(255, 255, 255, 0.08)",
    modalText: "#FFF",
    modalTextDim: "rgba(224, 232, 255, 0.3)",
    modalTextSecondary: "rgba(255, 255, 255, 0.6)",
    profileAction: "rgba(224, 232, 255, 0.1)",
    profileActionHover: "rgba(224, 232, 255, 0.2)",
    profileForeground: "rgba(224, 232, 255, 0.05)",
    selectedOptionBorder: "rgba(224, 232, 255, 0.1)",
    standby: "#FFD641",
  },
  shadows: {
    connectButton: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    dialog: "0px 8px 32px rgba(0, 0, 0, 0.32)",
    profileDetailsAction: "0px 2px 6px rgba(37, 41, 46, 0.04)",
    selectedOption: "0px 2px 6px rgba(0, 0, 0, 0.24)",
    selectedWallet: "0px 2px 6px rgba(0, 0, 0, 0.24)",
    walletLogo: "0px 2px 16px rgba(0, 0, 0, 0.16)",
  },
};

export default rainbowTheme;
