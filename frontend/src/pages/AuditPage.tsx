import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuditPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>User 'Jane Doe' exported data from Run #122.</li>
            <li>Admin 'System' updated 'Illumina NGS v1' template.</li>
            <li>User 'John Doe' uploaded 'sample_data.csv'.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPage;