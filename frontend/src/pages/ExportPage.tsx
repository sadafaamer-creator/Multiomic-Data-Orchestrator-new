import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  FileText,
  FileJson,
  FileArchive,
  ScrollText,
  Download,
  Loader2,
  Play,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRun } from "@/context/RunContext"; // Import useRun

interface Artifact {
  name: string;
  type: "csv" | "json" | "zip" | "report";
  size: string; // e.g., "1.2 MB"
  fileCount: number;
  downloadUrl: string; // Mock URL
}

const ExportPage: React.FC = () => {
  const navigate = useNavigate();
  const { validationResults, setCurrentStep, resetRun } = useRun(); // Get validationResults and resetRun from context
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingArtifactId, setDownloadingArtifactId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(3); // Set current step to Export
  }, [setCurrentStep]);

  const isReadyToExport = validationResults.blockerCount === 0;
  const blockerCount = validationResults.blockerCount;

  // Mock data for demonstration
  const mockArtifacts: Artifact[] = [
    {
      name: "Canonical Tables",
      type: "csv",
      size: "5.8 MB",
      fileCount: 3,
      downloadUrl: "/api/export/canonical-tables.zip",
    },
    {
      name: "Cross-Modal Join Index",
      type: "csv",
      size: "0.2 MB",
      fileCount: 1,
      downloadUrl: "/api/export/join-index.csv",
    },
    {
      name: "Mapping File",
      type: "json",
      size: "0.1 MB",
      fileCount: 1,
      downloadUrl: "/api/export/mapping.json",
    },
    {
      name: "Final Validation Report",
      type: "report",
      size: "0.3 MB",
      fileCount: 1,
      downloadUrl: "/api/export/validation-report.csv",
    },
    {
      name: "JSON Manifest",
      type: "json",
      size: "0.01 MB",
      fileCount: 1,
      downloadUrl: "/api/export/manifest.json",
    },
  ];

  const getArtifactIcon = (type: Artifact["type"]) => {
    switch (type) {
      case "csv":
      case "report":
        return <FileText className="h-6 w-6 text-muted-foreground" />;
      case "json":
        return <FileJson className="h-6 w-6 text-muted-foreground" />;
      case "zip":
        return <FileArchive className="h-6 w-6 text-muted-foreground" />;
      default:
        return <FileText className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const handleDownloadArtifact = async (artifact: Artifact) => {
    setDownloadingArtifactId(artifact.name);
    toast.loading(`Downloading ${artifact.name}...`);
    // Simulate download
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success(`${artifact.name} downloaded!`);
    setDownloadingArtifactId(null);
    // In a real app, you'd initiate the file download here, e.g., window.open(artifact.downloadUrl, '_blank');
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    toast.loading("Preparing all artifacts for download...");
    // Simulate ZIP creation and download
    await new Promise((resolve) => setTimeout(resolve, 3000));
    toast.success("All artifacts downloaded as ZIP!");
    setIsDownloadingAll(false);
    // In a real app, this would trigger a backend endpoint to generate and serve a ZIP
  };

  const handleNewRun = () => {
    resetRun(); // Reset the entire run state
    navigate("/runs");
    toast.info("Starting a new run.");
  };

  const handleViewAuditTrail = () => {
    navigate("/audit");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Export Run Data</h1>

      {/* Readiness Gate Section */}
      <Card
        className={cn(
          "border-2",
          isReadyToExport ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        )}
      >
        <CardContent className="flex items-center p-6">
          {isReadyToExport ? (
            <CheckCircle className="h-10 w-10 text-green-600 mr-4" />
          ) : (
            <XCircle className="h-10 w-10 text-red-600 mr-4" />
          )}
          <div>
            <CardTitle
              className={cn(
                "text-2xl font-bold",
                isReadyToExport ? "text-green-800" : "text-red-800"
              )}
            >
              {isReadyToExport ? "Ready to Export" : `Cannot export: ${blockerCount} blockers remaining`}
            </CardTitle>
            <CardDescription
              className={cn(
                "text-base",
                isReadyToExport ? "text-green-700" : "text-red-700"
              )}
            >
              {isReadyToExport
                ? "All validation checks passed. Your data is ready for export."
                : "Please resolve all blockers in the Validation step before exporting."}
            </CardDescription>
          </div>
        </CardContent>
      </Card>

      {/* Export Bundle Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Export Bundle</CardTitle>
          <CardDescription className="text-muted-foreground">
            Download the harmonized data and associated artifacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockArtifacts.map((artifact) => (
            <Card key={artifact.name} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  {getArtifactIcon(artifact.type)}
                  <CardTitle className="text-base font-medium">
                    {artifact.name}
                  </CardTitle>
                </div>
                <Badge variant="secondary">{artifact.type.toUpperCase()}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {artifact.fileCount} file(s) | {artifact.size}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDownloadArtifact(artifact)}
                  disabled={downloadingArtifactId === artifact.name || !isReadyToExport}
                >
                  {downloadingArtifactId === artifact.name ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <Button
          variant="outline"
          onClick={handleNewRun}
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Play className="mr-2 h-4 w-4" />
          Start New Run
        </Button>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="link"
            onClick={handleViewAuditTrail}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Audit Trail
          </Button>
          <Button
            onClick={handleDownloadAll}
            disabled={!isReadyToExport || isDownloadingAll}
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              (!isReadyToExport || isDownloadingAll) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isDownloadingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download All as ZIP
          </Button>
        </div>
      </CardFooter>
    </div>
  );
};

export default ExportPage;