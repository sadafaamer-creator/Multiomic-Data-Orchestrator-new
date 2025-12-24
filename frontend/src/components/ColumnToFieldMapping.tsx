import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronRight, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRun, TemplateField, MockTemplate, ParsedCsvData } from "@/context/RunContext"; // Import from RunContext

interface ColumnToFieldMappingProps {
  onNext: () => void;
}

const ColumnToFieldMapping: React.FC<ColumnToFieldMappingProps> = ({ onNext }) => {
  const {
    uploadedFiles,
    mockTemplates,
    getParsedCsvData,
    selectedFileIdForMapping,
    setSelectedFileIdForMapping,
    selectedTemplateIdForMapping,
    setSelectedTemplateIdForMapping,
    currentMapping,
    setCurrentMapping,
  } = useRun();

  const selectedFile = uploadedFiles.find(f => f.id === selectedFileIdForMapping);
  const selectedTemplate = mockTemplates.find(t => t.id === selectedTemplateIdForMapping);
  const parsedCsv = selectedFile ? getParsedCsvData(selectedFile.id) : undefined;

  const templateFields: TemplateField[] = selectedTemplate?.fields || [];
  const csvColumns: string[] = parsedCsv?.columns || [];

  // Dynamically create Zod schema based on required fields
  const formSchema = useMemo(() => {
    const schemaFields: Record<string, z.ZodString> = {};
    templateFields.forEach((field) => {
      if (field.required) {
        schemaFields[field.name] = z.string().min(1, { message: "Required field must be mapped." });
      } else {
        schemaFields[field.name] = z.string().optional().nullable();
      }
    });
    return z.object(schemaFields).superRefine((data, ctx) => {
      const mappedColumns = new Set<string>();
      for (const key in data) {
        const value = data[key];
        if (value && value !== "unmapped") { // "unmapped" is our placeholder for no selection
          if (mappedColumns.has(value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Column '${value}' is mapped to multiple canonical fields.`,
              path: [key],
            });
          }
          mappedColumns.add(value);
        }
      }
    });
  }, [templateFields]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: currentMapping,
    mode: "onChange",
  });

  const watchedMapping = useWatch({ control: form.control });

  useEffect(() => {
    // Update form defaults when selected file/template changes
    form.reset(currentMapping);
  }, [selectedFileIdForMapping, selectedTemplateIdForMapping, currentMapping, form]);

  useEffect(() => {
    setCurrentMapping(watchedMapping);
  }, [watchedMapping, setCurrentMapping]);

  const handleSaveMapping = () => {
    // In a real application, this would save the mapping to a backend or local storage
    console.log("Saving mapping:", currentMapping);
    toast.success("Mapping configuration saved!");
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    handleSaveMapping(); // Save before proceeding
    onNext();
  };

  const categories = useMemo(() => {
    const grouped: Record<string, TemplateField[]> = {};
    templateFields.forEach((field) => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    return grouped;
  }, [templateFields]);

  const totalRequiredFields = templateFields.filter((f) => f.required).length;
  const mappedRequiredFields = Object.entries(watchedMapping).filter(
    ([fieldName, mappedColumn]) =>
      templateFields.find((f) => f.name === fieldName)?.required &&
      mappedColumn &&
      mappedColumn !== "unmapped"
  ).length;

  const mappingProgress =
    totalRequiredFields > 0 ? (mappedRequiredFields / totalRequiredFields) * 100 : 100;

  const hasBlockers = Object.keys(form.formState.errors).length > 0;

  // Mock data for "Load Previous Configuration"
  const mockPreviousConfigs = [
    { id: "config-1", name: "Illumina NGS - Last Week" },
    { id: "config-2", name: "10x Single-Cell - Project X" },
  ];

  // Get preview values from parsedCsvDataMap
  const getPreviewValues = (columnName: string) => {
    if (!columnName || columnName === "unmapped" || !parsedCsv) return ["-", "-", "-"];
    return parsedCsv.previewRows[columnName] || ["-", "-", "-"];
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Column-to-Field Mapping</CardTitle>
        <CardDescription className="text-muted-foreground">
          Map your uploaded CSV columns to the canonical fields for the selected template.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Files and Templates Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="file-selector">Current File</Label>
            <Select
              value={selectedFileIdForMapping || ""}
              onValueChange={(value) => {
                setSelectedFileIdForMapping(value);
                const file = uploadedFiles.find(f => f.id === value);
                setSelectedTemplateIdForMapping(file?.selectedTemplateId || null);
                setCurrentMapping({}); // Reset mapping when file changes
              }}
            >
              <SelectTrigger id="file-selector">
                <SelectValue placeholder="Select an uploaded file" />
              </SelectTrigger>
              <SelectContent>
                {uploadedFiles.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    {file.file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="template-selector">Selected Template</Label>
            <Select
              value={selectedTemplateIdForMapping || ""}
              onValueChange={(value) => {
                setSelectedTemplateIdForMapping(value);
                setCurrentMapping({}); // Reset mapping when template changes
              }}
              disabled={!selectedFileIdForMapping}
            >
              <SelectTrigger id="template-selector">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {mockTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(!selectedFile || !selectedTemplate) && (
          <div className="text-center text-muted-foreground py-8">
            Please select an uploaded file and a template to begin mapping.
          </div>
        )}

        {selectedFile && selectedTemplate && (
          <>
            {/* Mapping Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Mapping Progress</span>
                <span>
                  {mappedRequiredFields}/{totalRequiredFields} required fields mapped
                </span>
              </div>
              <Progress value={mappingProgress} className="h-2" />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <ScrollArea className="h-[500px] pr-4">
                  {Object.entries(categories).map(([categoryName, fields]) => (
                    <div key={categoryName} className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">
                        {categoryName}
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {fields.map((field) => (
                          <FormField
                            key={field.name}
                            control={form.control}
                            name={field.name}
                            render={({ field: formField }) => (
                              <FormItem className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                                <div className="flex items-center space-x-2">
                                  <FormLabel className="text-sm font-medium">
                                    {field.name}
                                  </FormLabel>
                                  {field.required ? (
                                    <Badge variant="destructive" className="bg-red-100 text-red-700">Required</Badge>
                                  ) : (
                                    <Badge variant="secondary">Optional</Badge>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{field.helpText}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Type: {field.type}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <FormControl>
                                    <Select
                                      onValueChange={formField.onChange}
                                      value={formField.value || "unmapped"}
                                    >
                                      <SelectTrigger
                                        className={cn(
                                          "w-full sm:w-[200px]",
                                          form.formState.errors[field.name] && "border-destructive"
                                        )}
                                      >
                                        <SelectValue placeholder="Select CSV Column" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unmapped">
                                          <em>(Unmapped)</em>
                                        </SelectItem>
                                        {csvColumns.map((col) => (
                                          <SelectItem key={col} value={col}>
                                            {col}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <div className="flex-1 text-sm text-muted-foreground flex items-center gap-1">
                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                      {field.type}
                                    </span>
                                    <span className="ml-2">Preview:</span>
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                      {getPreviewValues(formField.value || "unmapped").join(", ")}
                                    </span>
                                  </div>
                                </div>
                                <FormMessage className="col-span-3 sm:col-start-2" />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveMapping}
                      type="button"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Configuration
                    </Button>
                    <Select>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Load Previous Config" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPreviousConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={hasBlockers || mappedRequiredFields !== totalRequiredFields}
                    className={cn(
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      (hasBlockers || mappedRequiredFields !== totalRequiredFields) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Next: Validate Data
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ColumnToFieldMapping;