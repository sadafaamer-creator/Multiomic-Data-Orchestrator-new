import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import CSVUpload from "@/components/CSVUpload";
import { toast } from "sonner";
import { useRun } from "@/context/RunContext"; // Import useRun

const RunsPage = () => {
  const { uploadedFiles } = useRun(); // Get uploadedFiles from context

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Runs</h1>
      </div>
      
      <CSVUpload /> {/* CSVUpload now manages its own state via RunContext */}

      {uploadedFiles.length === 0 && ( // Only show "No recent runs" if no files are uploaded
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent runs found. Start a new one by uploading files above!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RunsPage;