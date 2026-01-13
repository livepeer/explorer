import { Pipeline } from "@lib/api/types/get-available-pipelines";
import { Box, Skeleton } from "@livepeer/design-system";
import { ChevronDownIcon } from "@modulz/radix-icons";
import { useAvailableInferencePipelinesData } from "hooks";

interface PerformanceSelectorProps {
  selectedPipeline: Pipeline["id"] | null;
  setSelectedPipeline: (pipeline: Pipeline["id"] | null) => void;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
}

const PerformanceListSelector: React.FC<PerformanceSelectorProps> = ({
  selectedPipeline,
  setSelectedPipeline,
  selectedModel,
  setSelectedModel,
}) => {
  const { data: availPipelines, isValidating } =
    useAvailableInferencePipelinesData();
  const findPipelineIndex = (pipelineId) =>
    availPipelines.pipelines.findIndex((p) => p.id === pipelineId);

  const findModelIndex = (pipelineIndex, model) =>
    availPipelines.pipelines[pipelineIndex]?.models.findIndex(
      (m) => m === model
    );

  const indexOfSelectedPipeline = selectedPipeline
    ? findPipelineIndex(selectedPipeline)
    : -1;
  const indexOfSelectedModel =
    indexOfSelectedPipeline !== -1 && selectedModel
      ? findModelIndex(indexOfSelectedPipeline, selectedModel)
      : null;

  const indexOfSelectedOption =
    selectedPipeline && selectedModel
      ? `${indexOfSelectedPipeline},${indexOfSelectedModel}`
      : -1;

  const handleSelectChange = (e) => {
    const [pipelineIdx, modelIdx] = e.target.value.split(",").map(Number);

    if (pipelineIdx === -1) {
      setSelectedPipeline(null);
      setSelectedModel(null);
      return;
    }

    const selectedPipeline = availPipelines.pipelines[pipelineIdx];
    const selectedModel =
      modelIdx !== undefined ? selectedPipeline.models[modelIdx] : null;

    setSelectedPipeline(selectedPipeline.id);
    setSelectedModel(selectedModel);
  };

  if (isValidating) {
    return <Skeleton css={{ height: 20, width: 100 }} />;
  }

  return (
    <Box
      css={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <Box
        as="select"
        value={indexOfSelectedOption}
        onChange={handleSelectChange}
        css={{
          paddingTop: "$2",
          paddingBottom: "$2",
          paddingLeft: "$3",
          paddingRight: "$6",
          border: "1px solid $colors$neutral4",
          borderRadius: "$2",
          backgroundColor: "$panel",
          color: "$hiContrast",
          fontSize: "$2",
          fontWeight: 500,
          appearance: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          maxWidth: "50%", // Ensure the dropdown doesn't exceed the container width
          "@bp2": {
            maxWidth: "100%", // Remove margin-bottom for larger screens
          },
          "&:hover": {
            borderColor: "$neutral6",
            backgroundColor: "$neutral2",
          },
          "&:focus": {
            outline: "none",
            borderColor: "$primary9",
            boxShadow: "0 0 0 1px $colors$primary9",
          },
        }}
      >
        <Box as="option" key="-1" value={-1}>
          Transcoding
        </Box>
        {availPipelines?.pipelines?.length === 0 ? (
          <Box as="option" disabled>
            AI Pipelines Unavailable
          </Box>
        ) : (
          <>
            <Box as="option" disabled>
              ----------------
            </Box>
            <Box as="option" disabled>
              AI Pipelines
            </Box>
            <Box as="option" disabled>
              ----------------
            </Box>
            {availPipelines?.pipelines?.map((p, pindex) =>
              p.models?.map((m, mindex) => (
                <Box
                  as="option"
                  key={`${p.id}-${m}`}
                  value={`${pindex},${mindex}`}
                >
                  {p.id} - {m}
                </Box>
              ))
            )}
          </>
        )}
      </Box>
      <Box
        as={ChevronDownIcon}
        css={{
          position: "absolute",
          right: "$2",
          pointerEvents: "none",
          color: "$neutral9",
          width: "$4",
          height: "$4",
        }}
      />
    </Box>
  );
};

export default PerformanceListSelector;
