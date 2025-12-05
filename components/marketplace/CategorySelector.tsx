import { Button, Flex } from "@livepeer/design-system";

type Props = {
  categories: string[];
  activeCategory: string;
  onChange: (c: string) => void;
};

const CategorySelector = ({ categories, activeCategory, onChange }: Props) => (
  <Flex css={{ gap: "$2", flexWrap: "wrap" }}>
    {categories.map((category) => {
      const isActive = category === activeCategory;
      return (
        <Button
          key={category}
          size="2"
          onClick={() => onChange(category)}
          css={{
            borderRadius: "$pill",
            paddingLeft: "$3",
            paddingRight: "$3",
            paddingTop: "$1",
            paddingBottom: "$1",
            fontSize: "$1",
            fontWeight: 600,
            border: "1px solid",
            borderColor: isActive ? "rgba(16,185,129,0.8)" : "$neutral6",
            backgroundColor: isActive ? "rgba(16,185,129,0.2)" : "$neutral3",
            color: isActive ? "$hiContrast" : "$neutral11",
            boxShadow: isActive ? "0 0 0 1px rgba(16,185,129,0.25)" : "none",
            "&:hover": {
              borderColor: isActive ? "rgba(16,185,129,0.8)" : "$neutral7",
              backgroundColor: isActive ? "rgba(16,185,129,0.12)" : "$neutral4",
            },
          }}
        >
          {category}
        </Button>
      );
    })}
  </Flex>
);

export default CategorySelector;
