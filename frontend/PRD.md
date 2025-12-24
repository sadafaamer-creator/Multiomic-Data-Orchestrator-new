---
title: Product Requirements Document
app: neon-pangolin-nap
created: 2025-12-23T04:41:21.282Z
version: 1
source: Deep Mode PRD Generation
---

## Product Requirements Document: Multiomic Data Orchestrator (MDO)

**Version:** 1.0
**Date:** October 26, 2023
**Author:** [Your Name/Team]

---

### 1. Introduction

#### 1.1. Project Overview

The Multiomic Data Orchestrator (MDO) is a web-based application designed to streamline the ingestion, harmonization, validation, and export of complex multiomic datasets. It addresses the critical need for robust data quality control and integration across diverse biological modalities (e.g., genomics, transcriptomics, spatial data). The MDO facilitates the transformation of raw, platform-specific metadata into a standardized, canonical format, ensuring data integrity and interoperability for downstream analysis. A core value proposition of the MDO is its ability to handle and validate relationships across multiple CSV files simultaneously within a single "Run," each representing a different omic modality, thereby enabling true cross-modal data harmonization.

#### 1.2. Goals

*   Provide a user-friendly interface for uploading and managing multiomic data files.
*   Enable flexible mapping of user-provided CSV columns to predefined canonical fields.
*   Implement a robust validation engine to ensure data quality and consistency, including cross-modal relationship checks.
*   Generate standardized, exportable data bundles ready for downstream integration and analysis.
*   Improve data quality, reduce manual errors, and accelerate research workflows involving multiomic data.

#### 1.3. Scope (Minimum Viable Product - MVP)

This MVP focuses on the core workflow: Upload → Map → Validate → Export. It includes essential UI components for each step and a foundational backend for template and validation rule management. For template management, the MVP will leverage a database schema populated via seed files, deferring a full administrative UI for template creation and editing to a post-MVP phase.

#### 1.4. User Roles

The MDO defines two primary user roles with distinct permissions, particularly concerning template management:

*   **All Users:**
    *   **View Template Library:** Browse all available templates, filter by category (e.g., Illumina, 10x, Spatial), search by name, and identify recommended templates.
    *   **View Template Details:** Access detailed information for any template, including all defined canonical fields, field descriptions, help text, validation rules, example data, and version history.
    *   **Preview Template Schema:** Download the template definition as JSON, inspect field-level rules, view enum allowed values, and check regex patterns.
    *   **Compare Template Versions:** See changes between template versions, understand the impact of upgrades, and view deprecation notices.
    *   Perform all core MDO workflow actions: Upload, Map, Validate, and Export data using available templates.

*   **Admin Users (MVP - Backend/Seed File Management):**
    *   **Create New Template:** Define canonical field structures, set field types, requirements, and validations. Add field-level, row-level, table-level, and relationship rules. Set enum values and regex patterns. (Managed via seed files in MVP).
    *   **Edit Existing Template:** Modify field definitions, update validation rules, add new fields, and mark fields as deprecated. (Managed via seed files in MVP).
    *   **Version Templates:** Create new versions for changes, mark old versions as deprecated, and set migration notes. (Managed via seed files in MVP).
    *   **Template Testing:** Upload sample CSVs to test templates, dry-run validation rules, and debug rule failures. (Primarily a backend/developer function in MVP).
    *   **Import/Export Templates:** Export template definitions for backup or import templates from other MDO instances. (Primarily a backend/developer function in MVP).

### 2. Core Features

#### 2.1. Multi-file, Multi-omic Orchestration

The MDO is fundamentally designed to support the simultaneous upload and orchestration of multiple CSV files within a single "Run," each representing a distinct omic modality. This capability is central to its value proposition, enabling the harmonization and validation of relationships across different data types and platforms.

*   **Scenario Example:** A typical run might involve a user uploading three CSV files:
    *   An Illumina sample sheet (genomic + transcriptomic metadata).
    *   A 10x Genomics library file (single-cell RNA-seq metadata).
    *   A GeoMx or Visium spatial file (spatial transcriptomic data).
    All these files are derived from the same set of patient samples or FFPE blocks.
*   **Harmonization:** The orchestrator maps each file to its appropriate template (e.g., Illumina NGS, 10x Single-Cell, Spatial) and harmonizes the metadata into canonical entities (e.g., Specimen, Block, Slide, ROI, Library, Run).
*   **Cross-Modal Validation:** Crucially, the system validates cross-modal relationships, ensuring, for instance, that a `Block_ID` from spatial data correctly links to `Libraries` in Illumina data, or that 10x libraries map to the correct Illumina sequencing runs. It also identifies orphaned entities.
*   **Export:** The final export bundle includes a cross-modal join index, facilitating the integration of data across modalities for downstream analysis. Single-file runs are supported as a subset of this capability.

#### 2.2. Template Management

Templates are central to the MDO, defining the canonical structure and validation rules for various omic data types.

*   **MVP Strategy:** For the MVP, canonical fields and templates are stored in the database but managed through seed files rather than a full admin UI.
    *   **Database Schema:** A database schema will include tables for `templates`, `canonical_fields`, `field_enum_values`, and `validation_rules`.
    *   **Seed Files:** All template configurations are defined in version-controlled JSON files (e.g., `illumina-ngs-v1.json`, `10x-single-cell-v1.json`). These files contain complete template definitions, including field names, types, validation rules, help text, enum values, and required/conditional status.
    *   **Deployment:** Seed files are loaded into the database during deployment. Updates involve modifying the JSON, incrementing the version, and re-running the seed script.
    *   **Benefits:** This approach provides database-driven benefits (queryable, relational integrity, version tracking) without the overhead of building an admin UI for the MVP, while establishing a clear upgrade path for a visual template editor post-MVP.
    *   **Backend API:** The backend exposes API endpoints (e.g., `GET /api/templates`, `GET /api/templates/:id`) to serve template definitions to the frontend mapping interface.
    *   **Version Control:** All template changes are version-controlled in Git, ensuring reproducibility and auditability.

#### 2.3. Robust Validation Engine

The MDO incorporates a sophisticated validation engine to ensure data quality and consistency across all uploaded files and their interrelationships.

*   **Rule Definition:** Validation rules are defined within the same seed files as canonical fields and stored in the `validation_rules` database table. Each rule includes:
    *   `rule_id`
    *   `rule_type` (field, row, table, relationship)
    *   `severity` (blocker, warning, info)
    *   `rule_logic` (JSON configuration specifying the validation function and parameters)
    *   Human-readable error messages with remediation guidance.
*   **Execution Flow:** During the "Validate" step, the backend loads all active rules associated with the selected templates for the current run. Rules are executed sequentially in a deterministic order:
    1.  **Field-level rules:** Check required fields, regex patterns, type validation, enum values.
    2.  **Row-level rules:** Perform cross-field consistency checks within a single row.
    3.  **Table-level rules:** Enforce uniqueness constraints, composite keys within a single file/table.
    4.  **Relationship-level rules:** Validate referential integrity across entities (e.g., Block → Slide → ROI → Library → Run) and across different uploaded files.
*   **Rule Logic Examples:**
    *   `{"type": "regex", "pattern": "^[A-Z0-9_-]+$"}` for pattern matching.
    *   `{"type": "unique", "scope": "run"}` for uniqueness checks across a run.
    *   `{"type": "hamming_distance", "min_distance": 3, "scope": "lane"}` for Illumina index collision detection.
*   **Violation Capture:** The rules engine iterates through the harmonized data, applies each rule, and captures violations with detailed information (row number, column, severity).
*   **Aggregation:** Results are aggregated into blocker, warning, and info counts.
    *   **Blockers:** Prevent data export.
    *   **Warnings:** Advisory messages that do not prevent export.
    *   **Info:** Informational messages.
*   **Platform-Specific Rules:** Rules specific to platforms (e.g., Illumina read structure validation, 10x chemistry compatibility, spatial slide barcode formats) are embedded within their respective template seed files.
*   **Declarative System:** The entire validation system is declarative, version-controlled, reproducible, and auditable, without hardcoded logic or LLM involvement in pass/fail determinations.

### 3. User Interface Components

#### 3.1. Main Application Layout

A responsive React component serving as the main application shell.

*   **Structure:**
    *   **Header:** Contains the MDO text logo and a user menu (e.g., profile, logout).
    *   **Navigation Sidebar:** Features icons for key sections: Dashboard, Runs, Templates, Audit.
    *   **Main Content Area:** Provides proper spacing for page-specific content.
    *   **Progress Stepper:** Visually guides the user through the main workflow steps: Upload → Map → Validate → Export. This stepper reflects the overall progress of a multi-file run.
    *   **Footer:** Displays version information.
*   **Styling:** Uses Tailwind CSS with the defined color scheme.
*   **Responsiveness:** The sidebar hides on mobile viewports, replaced by a hamburger menu icon in the header.
*   **Props:**
    *   `children`: ReactNode - Accepts child components to render the specific page content within the main content area.

#### 3.2. CSV File Upload Component

A reusable React component for uploading one or more CSV files within a single run.

*   **Features:**
    *   **Drag and Drop Zone:** A clearly defined area with a dashed border and a visual hover effect to indicate readiness for file drops.
    *   **File Browser Button:** A fallback button to open the native file selection dialog.
    *   **File Type Restriction:** Accepts only `.csv` files.
    *   **Upload Progress Bar:** Displays progress during the upload of each file.
    *   **Uploaded File Cards:** Displays a list of cards, one for each uploaded file in the current run. Each card shows:
        *   Filename
        *   File size (formatted as KB/MB)
        *   Row count (after backend analysis)
        *   Status indicator (green checkmark for success, red X for error)
        *   Template selector dropdown (to associate the file with a specific template)
        *   Delete button (to remove the file from the current run)
*   **Props:**
    *   `onFileUpload`: `(file: File) => Promise<UploadResponse>` - Callback triggered when a file is selected/dropped. This function should handle the actual upload to the backend.
    *   `onFileDelete`: `(uploadId: string) => void` - Callback triggered when a file's delete button is clicked.
    *   `acceptedFiles`: `string[]` (default: `['.csv']`) - Specifies allowed file types.
    *   `maxSize`: `number` (default: `200MB`) - Maximum allowed file size in bytes.
*   **Error Handling:**
    *   File too large
    *   Invalid file type
    *   Upload failure (e.g., network error, backend issue)
    *   UTF-8 encoding issues (detected post-upload by backend, reflected in status)
*   **Styling:** Uses Tailwind CSS.
*   **Icons:** Uses `lucide-react`.

#### 3.3. Column-to-Field Mapping Component

A complex React component facilitating the mapping of CSV columns from multiple uploaded files to canonical fields.

*   **Structure:**
    *   **Files and Templates Selector:** At the top, allowing users to select which uploaded file's columns are currently being mapped and which template it corresponds to. This enables switching between files within a run for mapping.
    *   **Scrollable List of Canonical Fields:** Fields are grouped by category (e.g., "Sample Information," "Sequencing Details").
    *   **Each Field Entry:**
        *   Field name with a required/optional badge.
        *   Help text tooltip (info icon) providing context and guidance.
        *   Dropdown to select a corresponding CSV column from the currently selected file.
        *   Data type indicator (e.g., String, Integer, Date).
        *   Preview of the first 3 values from the selected CSV column to aid mapping accuracy.
*   **Props:**
    *   `templateFields`: `Array<{name: string, type: string, required: boolean, helpText: string, category: string}>` - Definitions of canonical fields for the selected template.
    *   `csvColumns`: `string[]` - List of column headers from the currently selected CSV file.
    *   `currentMapping`: `Record<string, string>` - An object representing the current mapping (canonicalFieldName: csvColumnName).
    *   `onMappingChange`: `(mapping: Record<string, string>) => void` - Callback for when a mapping selection changes.
    *   `onSave`: `() => void` - Callback for saving the current mapping configuration for the selected file.
*   **Features:**
    *   **Highlight Unmapped Required Fields:** Required fields that have not been mapped are visually highlighted (e.g., in red).
    *   **Mapping Progress Indicator:** Displays progress (e.g., "5/10 required fields mapped") for the currently selected file.
    *   **"Save Configuration" Button:** Saves the current mapping for the selected file.
    *   **"Load Previous Configuration" Dropdown:** Allows users to load a previously saved mapping for the selected file or a similar file.
*   **Validation:**
    *   **Required Field Check:** Ensures all required fields for the selected template are mapped before enabling the "Next" button in the stepper.
    *   **Duplicate Column Warning:** Warns the user if the same CSV column is mapped to multiple canonical fields.
*   **State Management:** Uses React Hook Form for efficient form state management.
*   **Styling:** Uses Tailwind CSS.

#### 3.4. Validation Results Component

A React component to display the aggregated validation results for the entire run, encompassing all uploaded files and cross-modal checks.

*   **Summary Section:**
    *   Three large cards displaying counts:
        *   **Blockers:** (Red, with 🔴 icon) - Issues preventing export.
        *   **Warnings:** (Amber, with ⚠️ icon) - Advisory issues.
        *   **Info:** (Blue, with ℹ️ icon) - Informational messages.
*   **Filters:**
    *   Dropdown for severity (Blocker, Warning, Info).
    *   Dropdown for rule ID.
    *   Text input for field name search.
*   **Results Table:**
    *   **Columns:** Severity Icon, Row #, Column, Rule ID, Description.
    *   **Color-coded Rows:** Rows are color-coded based on severity (red for blockers, amber for warnings, blue for info).
    *   **Sortable Columns:** All columns are sortable.
    *   **Pagination:** Displays 50 issues per page.
    *   **Expandable Rows:** Allows expanding a row to show more context or detailed remediation guidance.
*   **Actions:**
    *   **"Download Validation Report (CSV)" Button:** Prominent button to download a detailed report of all validation issues.
    *   **"Fix and Re-upload" Button:** Links back to the upload page, allowing users to modify and re-upload files to address issues.
*   **Props:**
    *   `validationData`: `{blockerCount: number, warningCount: number, infoCount: number, issues: Array<{severity: string, row: number, column: string, ruleId: string, description: string, context?: string}>}` - The aggregated validation results for the entire run.
    *   `onDownloadReport`: `() => void` - Callback for downloading the report.
    *   `onReupload`: `() => void` - Callback for navigating back to the upload step.
*   **Table Library:** Uses TanStack Table (React Table v8) for efficient data table management.
*   **Styling:** Uses Tailwind CSS.

#### 3.5. Export Page Component

A React component to finalize the run and manage the export of harmonized data and artifacts.

*   **Readiness Gate Section:**
    *   Large status indicator:
        *   **Ready to Export:** Green checkmark with "Ready to Export" if `blockerCount` is 0.
        *   **Cannot Export:** Red X with "Cannot export: X blockers remaining" if `blockerCount` > 0.
*   **Export Bundle Cards:**
    *   A list of downloadable artifacts, each represented by a card showing:
        *   Icon (appropriate for file type, e.g., CSV, JSON, ZIP).
        *   Artifact name (e.g., "Canonical Tables," "Cross-Modal Join Index").
        *   File count and total size.
        *   Download button for individual artifact.
*   **Artifacts (for the entire run):**
    1.  **Canonical Tables:** Multiple CSV files, one for each harmonized entity (e.g., `specimens.csv`, `libraries.csv`).
    2.  **Cross-Modal Join Index:** A crucial CSV file detailing how to link data across different modalities and entities within the run.
    3.  **Mapping File:** A JSON file containing the final column-to-field mappings used for each uploaded file.
    4.  **Final Validation Report:** A CSV file summarizing all validation issues (blockers, warnings, info).
    5.  **JSON Manifest:** A manifest file describing the contents of the export bundle.
*   **Actions:**
    *   **"Download All as ZIP" Button:** Primary button to download all artifacts as a single ZIP archive. This button is disabled if `isReady` is false (i.e., blockers remain).
    *   **"Start New Run" Button:** Secondary button to clear the current run and begin a new data orchestration process.
    *   **"View Audit Trail" Link:** Navigates to the audit log for the current run.
*   **Props:**
    *   `isReady`: `boolean` - Indicates if the run is ready for export (no blockers).
    *   `blockerCount`: `number` - The total number of blockers remaining.
    *   `artifacts`: `Array<{name: string, type: string, size: string, fileCount: number, downloadUrl: string}>` - Details of each downloadable artifact.
    *   `onDownloadAll`: `() => void` - Callback for initiating the "Download All as ZIP" action.
    *   `onNewRun`: `() => void` - Callback for starting a new run.
*   **Loading States:** Implement loading indicators for download actions to provide user feedback.
*   **Styling:** Uses Tailwind CSS.

### 4. Technical Details & Constraints

#### 4.1. Frontend Technologies

*   **Framework:** React
*   **Form Management:** React Hook Form (for complex forms like mapping)
*   **Table Management:** TanStack Table (React Table v8)
*   **State Management:** React Context API or Zustand (to be decided based on complexity)

#### 4.2. Styling

*   **Framework:** Tailwind CSS
*   **Color Scheme:**
    *   Primary: `#2563EB`
    *   Background: `#F9FAFB`
    *   Surface: `#FFFFFF`
    *   Border: `#E5E7EB`
    *   Text: `#111827`

#### 4.3. Icons

*   **Library:** `lucide-react`

#### 4.4. Backend Integration

*   **API Endpoints:** The frontend will interact with a backend API for file uploads, template retrieval (`GET /api/templates`, `GET /api/templates/:id`), mapping persistence, validation execution, and artifact generation.
*   **Template Management:** As per MVP scope, templates and validation rules are managed via seed files and stored in a database (tables for `templates`, `canonical_fields`, `field_enum_values`, `validation_rules`).

### 5. Future Considerations (Post-MVP)

*   **Full Template Admin UI:** A dedicated user interface for Admin Users to create, edit, version, and test templates directly within the application, replacing the seed-file approach.
*   **User Authentication & Authorization:** Robust user management, role-based access control, and potentially integration with SSO.
*   **Dashboard & Reporting:** Enhanced dashboard features for tracking run history, data quality trends, and user activity.
*   **Advanced Data Preview:** More sophisticated data preview capabilities, including statistical summaries and basic visualizations.
*   **API for Programmatic Access:** Exposing a public API for programmatic upload, mapping, validation, and export.
*   **Integration with LIMS/ELN:** Direct integration with Laboratory Information Management Systems (LIMS) or Electronic Lab Notebooks (ELN) for automated data flow.