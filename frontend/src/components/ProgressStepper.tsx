import React from "react";
import { cn } from "@/lib/utils";

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center space-x-4 py-4 px-6 bg-card border-b border-border">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : index < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:block",
                index === currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5",
                index < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressStepper;