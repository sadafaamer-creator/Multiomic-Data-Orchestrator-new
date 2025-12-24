import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">120</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Validation Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-500">23</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Run #123 completed with 2 warnings.</li>
            <li>Template 'Illumina NGS v2' updated.</li>
            <li>User 'John Doe' started a new run.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;