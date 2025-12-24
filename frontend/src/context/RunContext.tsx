import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

// --- Type Definitions ---
export interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  helpText: string;
  category: string;
}

export interface MockTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
  // In a real app, this would also contain validation rules
}

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
  rowCount?: number;
  selectedTemplateId?: string;
}

export interface ParsedCsvData {
  columns: string[];
  previewRows: Record<string, string[]>; // Map column name to first few values
}

export interface ValidationIssue {
  id: string;
  severity: "blocker" | "warning" | "info";
  row: number;
  column: string;
  ruleId: string;
  description: string;
  context?: string;
}

export interface ValidationResults {
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
}

// --- Mock Data ---
const mockTemplates: MockTemplate[] = [
  {
    id: "illumina-ngs-v1",
    name: "Illumina NGS v1",
    fields: [
      { name: "Sample_ID", type: "String", required: true, helpText: "Unique identifier for each biological sample.", category: "Sample Information" },
      { name: "Patient_ID", type: "String", required: true, helpText: "Identifier for the patient from whom the sample was derived.", category: "Sample Information" },
      { name: "Sample_Type", type: "Enum", required: true, helpText: "Type of biological sample (e.g., FFPE, Fresh Frozen, Blood).", category: "Sample Information" },
      { name: "Collection_Date", type: "Date", required: false, helpText: "Date when the sample was collected.", category: "Sample Information" },
      { name: "Concentration_ng_ul", type: "Number", required: false, helpText: "Concentration of the extracted nucleic acid in ng/µL.", category: "Library & Sequencing" },
      { name: "Library_ID", type: "String", required: true, helpText: "Unique identifier for the sequencing library.", category: "Library & Sequencing" },
      { name: "Sequencing_Platform", type: "String", required: true, helpText: "The sequencing platform used (e.g., Illumina NovaSeq, 10x Genomics).", category: "Library & Sequencing" },
      { name: "Read_Length", type: "Integer", required: false, helpText: "Length of the sequencing reads (e.g., 150bp).", category: "Library & Sequencing" },
      { name: "Block_ID", type: "String", required: false, helpText: "Identifier for the FFPE block, if applicable.", category: "Spatial Data" },
      { name: "ROI_Name", type: "String", required: false, helpText: "Name of the Region of Interest for spatial transcriptomics.", category: "Spatial Data" },
    ],
  },
  {
    id: "10x-single-cell-v1",
    name: "10x Single-Cell v1",
    fields: [
      { name: "Cell_Ranger_ID", type: "String", required: true, helpText: "Unique identifier for the Cell Ranger run.", category: "10x Specific" },
      { name: "Sample_ID", type: "String", required: true, helpText: "Unique identifier for each biological sample.", category: "Sample Information" },
      { name: "Chemistry_Version", type: "String", required: true, helpText: "10x Genomics chemistry version used.", category: "10x Specific" },
      { name: "Number_of_Cells", type: "Integer", required: false, helpText: "Estimated number of cells recovered.", category: "10x Specific" },
    ],
  },
  {
    id: "geomx-spatial-v1",
    name: "GeoMx Spatial v1",
    fields: [
      { name: "Slide_ID", type: "String", required: true, helpText: "Unique identifier for the GeoMx slide.", category: "Spatial Data" },
      { name: "ROI_ID", type: "String", required: true, helpText: "Unique identifier for the Region of Interest.", category: "Spatial Data" },
      { name: "Panel_Name", type: "String", required: true, helpText: "Name of the GeoMx panel used.", category: "Spatial Data" },
      { name: "Area_um2", type: "Number", required: false, helpText: "Area of the ROI in square micrometers.", category: "Spatial Data" },
    ],
  },
];

const mockParsedCsvData: Record<string, ParsedCsvData> = {
  "mock-file-1": { // Corresponds to sample_data_illumina.csv
    columns: ["SampleID", "PatientIdentifier", "MaterialType", "DateCollected", "DNA_Concentration", "LibraryName", "Platform", "ReadLength", "FFPE_Block", "RegionOfInterest", "Notes", "UnusedColumn"],
    previewRows: {
      "SampleID": ["S001", "S002", "S003"],
      "PatientIdentifier": ["P-001", "P-002", "P-003"],
      "MaterialType": ["FFPE", "Fresh Frozen", "Blood"],
      "DateCollected": ["2023-01-01", "2023-01-02", "2023-01-03"],
      "DNA_Concentration": ["1.2", "3.5", "0.8"],
      "LibraryName": ["LIB001", "LIB002", "LIB003"],
      "Platform": ["Illumina NovaSeq", "Illumina NovaSeq", "Illumina HiSeq"],
      "ReadLength": ["150", "150", "100"],
      "FFPE_Block": ["BLK001", "BLK002", "BLK003"],
      "RegionOfInterest": ["ROI_A", "ROI_B", "ROI_C"],
      "Notes": ["", "High quality", ""],
      "UnusedColumn": ["", "", ""],
    },
  },
  "mock-file-2": { // Corresponds to 10x_libraries.csv
    columns: ["Sample_ID_10x", "CellRangerID", "Chemistry", "NumCells"],
    previewRows: {
      "Sample_ID_10x": ["S001", "S004", "S005"],
      "CellRangerID": ["CR001", "CR002", "CR003"],
      "Chemistry": ["V3", "V3.1", "V2"],
      "NumCells": ["5000", "7500", "3000"],
    },
  },
};

// --- Context Definition ---
interface RunContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  updateUploadedFile: (id: string, updates: Partial<UploadedFile>) => void;
  removeUploadedFile: (id: string) => void;
  getParsedCsvData: (fileId: string) => ParsedCsvData | undefined;
  mockTemplates: MockTemplate[];
  selectedFileIdForMapping: string | null;
  setSelectedFileIdForMapping: (fileId: string | null) => void;
  selectedTemplateIdForMapping: string | null;
  setSelectedTemplateIdForMapping: (templateId: string | null) => void;
  currentMapping: Record<string, string>;
  setCurrentMapping: (mapping: Record<string, string>) => void;
  validationResults: ValidationResults;
  runMockValidation: (fileId: string, templateId: string, mapping: Record<string, string>) => void;
  resetRun: () => void;
}

const RunContext = createContext<RunContextType | undefined>(undefined);

export const RunProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parsedCsvDataMap, setParsedCsvDataMap] = useState<Record<string, ParsedCsvData>>({});
  const [selectedFileIdForMapping, setSelectedFileIdForMapping] = useState<string | null>(null);
  const [selectedTemplateIdForMapping, setSelectedTemplateIdForMapping] = useState<string | null>(null);
  const [currentMapping, setCurrentMapping] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<ValidationResults>({
    blockerCount: 0,
    warningCount: 0,
    infoCount: 0,
    issues: [],
  });

  const addUploadedFile = useCallback((file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
    // Simulate CSV parsing and store mock data
    const mockDataKey = file.file.name.includes("illumina") ? "mock-file-1" : "mock-file-2";
    setParsedCsvDataMap((prev) => ({
      ...prev,
      [file.id]: mockParsedCsvData[mockDataKey] || { columns: [], previewRows: {} },
    }));
  }, []);

  const updateUploadedFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const removeUploadedFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setParsedCsvDataMap((prev) => {
      const newMap = { ...prev };
      delete newMap[id];
      return newMap;
    });
    // Reset mapping if the removed file was selected for mapping
    if (selectedFileIdForMapping === id) {
      setSelectedFileIdForMapping(null);
      setSelectedTemplateIdForMapping(null);
      setCurrentMapping({});
    }
  }, [selectedFileIdForMapping]);

  const getParsedCsvData = useCallback((fileId: string) => {
    return parsedCsvDataMap[fileId];
  }, [parsedCsvDataMap]);

  const runMockValidation = useCallback((fileId: string, templateId: string, mapping: Record<string, string>) => {
    const issues: ValidationIssue[] = [];
    let blockerCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    const template = mockTemplates.find(t => t.id === templateId);
    const parsedCsv = parsedCsvDataMap[fileId];

    if (!template || !parsedCsv) {
      issues.push({
        id: "VAL-000", severity: "blocker", row: 0, column: "N/A", ruleId: "SYSTEM_ERROR",
        description: "Template or parsed CSV data not found for validation.",
        context: "Ensure a file is uploaded and a template is selected."
      });
      blockerCount++;
    } else {
      // Rule 1: Check for unmapped required fields
      template.fields.filter(f => f.required).forEach(requiredField => {
        if (!mapping[requiredField.name] || mapping[requiredField.name] === "unmapped") {
          issues.push({
            id: `REQ-${requiredField.name}`, severity: "blocker", row: 0, column: requiredField.name,
            ruleId: "REQUIRED_FIELD_MISSING",
            description: `Required canonical field '${requiredField.name}' is not mapped.`,
            context: `Map '${requiredField.name}' to a column in your CSV file.`
          });
          blockerCount++;
        }
      });

      // Rule 2: Check for duplicate CSV column mappings
      const mappedColumns = new Map<string, string[]>(); // column -> [canonicalFields]
      Object.entries(mapping).forEach(([canonicalField, csvColumn]) => {
        if (csvColumn && csvColumn !== "unmapped") {
          if (!mappedColumns.has(csvColumn)) {
            mappedColumns.set(csvColumn, []);
          }
          mappedColumns.get(csvColumn)?.push(canonicalField);
        }
      });

      mappedColumns.forEach((canonicalFields, csvColumn) => {
        if (canonicalFields.length > 1) {
          issues.push({
            id: `DUP-${csvColumn}`, severity: "warning", row: 0, column: csvColumn,
            ruleId: "DUPLICATE_COLUMN_MAPPING",
            description: `CSV column '${csvColumn}' is mapped to multiple canonical fields: ${canonicalFields.join(", ")}.`,
            context: "Consider if this is intentional. If not, adjust your mappings."
          });
          warningCount++;
        }
      });

      // Add some static mock issues for variety, similar to previous ValidationPage
      if (issues.length === 0) { // Only add if no blockers from dynamic checks
        issues.push(
          { id: "issue-3", severity: "warning", row: 8, column: "Concentration", ruleId: "VALUE_RANGE", description: "Concentration value is outside typical range (expected 1-100 ng/µL).", context: "Value 0.5 ng/µL is unusually low. Verify measurement or adjust expected range if valid." },
          { id: "issue-4", severity: "warning", row: 15, column: "Sequencing_Date", ruleId: "DATE_FORMAT", description: "Invalid date format. Expected YYYY-MM-DD.", context: "Date '15/03/2023' should be '2023-03-15'. Please correct the format." },
          { id: "issue-5", severity: "warning", row: 20, column: "Block_ID", ruleId: "CROSS_MODAL_LINK", description: "Block_ID 'BLK007' not found in spatial data file.", context: "This Block_ID is present in the Illumina file but has no corresponding entry in the GeoMx spatial file. This might indicate an orphaned entity or a typo." },
          { id: "issue-6", severity: "info", row: 3, column: "Notes", ruleId: "METADATA_SUGGESTION", description: "Consider adding 'Project_Name' for better organization.", context: "Adding a 'Project_Name' column can help in filtering and and grouping data for large studies." },
        );
        warningCount += 3;
        infoCount += 1;
      }
    }

    setValidationResults({
      blockerCount,
      warningCount,
      infoCount,
      issues,
    });
    toast.info("Validation complete!");
  }, [parsedCsvDataMap]);

  const resetRun = useCallback(() => {
    setCurrentStep(0);
    setUploadedFiles([]);
    setParsedCsvDataMap({});
    setSelectedFileIdForMapping(null);
    setSelectedTemplateIdForMapping(null);
    setCurrentMapping({});
    setValidationResults({ blockerCount: 0, warningCount: 0, infoCount: 0, issues: [] });
  }, []);

  return (
    <RunContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        uploadedFiles,
        addUploadedFile,
        updateUploadedFile,
        removeUploadedFile,
        getParsedCsvData,
        mockTemplates,
        selectedFileIdForMapping,
        setSelectedFileIdForMapping,
        selectedTemplateIdForMapping,
        setSelectedTemplateIdForMapping,
        currentMapping,
        setCurrentMapping,
        validationResults,
        runMockValidation,
        resetRun,
      }}
    >
      {children}
    </RunContext.Provider>
  );
};

export const useRun = () => {
  const context = useContext(RunContext);
  if (context === undefined) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return context;
};