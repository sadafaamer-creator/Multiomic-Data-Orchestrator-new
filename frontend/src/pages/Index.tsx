import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Welcome to Multiomic Data Orchestrator (MDO)
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Streamline your multiomic data ingestion, harmonization, validation, and export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base text-foreground">
            Get started by orchestrating a new run, managing your templates, or reviewing past audits.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/runs">Start a New Run</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
              <Link to="/templates">Browse Templates</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;