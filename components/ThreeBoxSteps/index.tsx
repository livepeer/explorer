import { Box } from "@livepeer/design-system";
import { Step, StepLabel, Stepper } from "@mui/material";
import { stepperStyles } from "utils/stepperStyles";

function getSteps(hasProfile) {
  if (hasProfile) {
    return ["Sign message #1", "Sign message #2"];
  } else {
    return ["Sign message #1", "Sign message #2", "Sign message #3"];
  }
}

const Index = ({ hasProfile, activeStep }) => {
  const steps = getSteps(hasProfile);

  return (
    <Box css={{ ...stepperStyles, marginBottom: 0, paddingTop: "$4", paddingBottom: "$4" }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, _index) => (
          <Step key={label}>
            <Box as={StepLabel} css={{ fontFamily: "$primary" }}>
              {label}
            </Box>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default Index;
