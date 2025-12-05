import { Box } from "@livepeer/design-system";
import { MagnifyingGlassIcon } from "@modulz/radix-icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search apps and APIs",
}: Props) => (
  <Box
    css={{
      position: "relative",
      width: "100%",
      "@bp2": {
        maxWidth: 320,
      },
    }}
  >
    <Box
      as={MagnifyingGlassIcon}
      aria-hidden
      css={{
        position: "absolute",
        left: "$3",
        top: "50%",
        transform: "translateY(-50%)",
        color: "$neutral9",
      }}
    />
    <Box
      as="input"
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      placeholder={placeholder}
      type="text"
      css={{
        height: 36,
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.4)",
        border: "1px solid $neutral7",
        borderRadius: 9999,
        padding: "$2",
        paddingLeft: "$6",
        paddingRight: "$3",
        color: "$hiContrast",
        fontSize: "$2",
        outline: "none",
        "&::placeholder": {
          color: "$neutral9",
        },
        "&:focus": {
          borderColor: "rgba(16,185,129,0.6)",
        },
      }}
    />
  </Box>
);

export default SearchInput;
