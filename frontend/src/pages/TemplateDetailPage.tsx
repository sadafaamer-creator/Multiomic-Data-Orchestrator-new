import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRun, TemplateField } from "@/context/RunContext";
import { cn } from "@/lib/utils";

const TemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { mockTemplates } = useRun();

  const template = useMemo(
    () => mockTemplates.find((t) => t.id === templateId),
    [templateId, mockTemplates]
  );

  useEffect(() => {
    if (!template) {
      // If template not found, redirect to templates list
      navigate("/templates", { replace: true });
    }
  }, [template, navigate]);

  if (!template) {
    return (
      <div className="container mx-auto py-8 text-center text-muted-foreground">
        Loading template details...
      </div>
    );
  }

  const categories = useMemo(() => {
    const grouped: Record<string, TemplateField[]> = {};
    template.fields.forEach((field) => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    return grouped;
  }, [template.fields]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="outline" onClick={() => navigate("/templates")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">
            {template.name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed schema and validation rules for this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Template ID</p>
              <p className="text-foreground font-mono">{template.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-foreground">v1</p> {/* Mock version for now */}
            </div>
          </div>

          <h3 className="text-xl font-semibold text-foreground mt-6 mb-4">Canonical Fields</h3>
          <Accordion type="multiple" className="w-full">
            {Object.entries(categories).map(([categoryName, fields]) => (
              <AccordionItem key={categoryName} value={categoryName}>
                <AccordionTrigger className="text-lg font-medium text-foreground hover:no-underline">
                  {categoryName} ({fields.length})
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/20 rounded-md mt-2">
                  <div className="grid grid-cols-1 gap-4">
                    {fields.map((field) => (
                      <div key={field.name} className="flex items-center justify-between p-3 border rounded-md bg-card">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-foreground">{field.name}</span>
                          {field.required ? (
                            <Badge variant="destructive" className="bg-red-100 text-red-700">Required</Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                          <Badge variant="outline" className="font-mono text-xs">{field.type}</Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{field.helpText}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* In a real app, validation rules would be displayed here */}
                        <span className="text-sm text-muted-foreground">
                          {/* Mock rule indicator */}
                          {field.type === "String" && "Regex: ^[A-Z0-9_-]+$"}
                          {field.type === "Enum" && "Values: FFPE, Fresh Frozen, Blood"}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDetailPage;