import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ColumnToFieldMapping from "@/components/ColumnToFieldMapping";
import { useRun } from "@/context/RunContext"; // Import useRun

const MappingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    setCurrentStep,
    selectedFileIdForMapping,
    selectedTemplateIdForMapping,
    currentMapping,
    runMockValidation,
    uploadedFiles,
    mockTemplates,
  } = useRun();

  useEffect(() => {
    setCurrentStep(1); // Set current step to Mapping
  }, [setCurrentStep]);

  const handleNextStep = () => {
    if (!selectedFileIdForMapping || !selectedTemplateIdForMapping) {
      // This case should ideally be prevented by the ColumnToFieldMapping component's UI
      console.error("No file or template selected for mapping.");
      return;
    }

    // Run mock validation before navigating
    runMockValidation(selectedFileIdForMapping, selectedTemplateIdForMapping, currentMapping);

    setCurrentStep(2); // Move to Validate step
    navigate("/validation");
  };

  // Redirect if no files are uploaded or no file/template is selected for mapping
  useEffect(() => {
    if (uploadedFiles.length === 0) {
      navigate("/runs");
      return;
    }
    // If a file is uploaded but no specific file is selected for mapping yet,
    // default to the first one. This handles direct navigation to /map without selection.
    if (!selectedFileIdForMapping && uploadedFiles.length > 0) {
      // This logic is now handled in CSVUpload's handleNextStep
      // but keeping this check for robustness if user navigates directly
      // console.warn("No file selected for mapping, defaulting to first uploaded file.");
      // setSelectedFileIdForMapping(uploadedFiles[0].id);
      // setSelectedTemplateIdForMapping(uploadedFiles[0].selectedTemplateId || null);
    }
  }, [uploadedFiles, selectedFileIdForMapping, navigate]);


  return (
    <div className="container mx-auto py-8">
      <ColumnToFieldMapping
        onNext={handleNextStep}
      />
    </div>
  );
};

export default MappingPage;