import React, { useEffect } from "react";
import ValidationResults from "@/components/ValidationResults";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRun } from "@/context/RunContext"; // Import useRun

const ValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const { validationResults, setCurrentStep } = useRun(); // Get validationResults from context

  useEffect(() => {
    setCurrentStep(2); // Set current step to Validation
  }, [setCurrentStep]);

  const handleDownloadReport = () => {
    alert("Downloading validation report...");
    // In a real app, this would trigger a backend API call to generate and download the report.
  };

  const handleReupload = () => {
    setCurrentStep(0); // Go back to Upload step
    navigate("/runs");
  };

  const handleNextStep = () => {
    setCurrentStep(3); // Move to Export step
    navigate("/export");
  };

  return (
    <div className="container mx-auto py-8">
      <ValidationResults
        validationData={validationResults} // Use dynamic validationResults
        onDownloadReport={handleDownloadReport}
        onReupload={handleReupload}
      />
      {/* Add a button to proceed to export if no blockers */}
      {validationResults.blockerCount === 0 && (
        <div className="flex justify-end mt-6">
          <Button onClick={handleNextStep} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Proceed to Export
          </Button>
        </div>
      )}
    </div>
  );
};

export default ValidationPage;