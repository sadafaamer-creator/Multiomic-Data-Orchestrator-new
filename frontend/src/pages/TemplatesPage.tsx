import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRun } from "@/context/RunContext"; // Import useRun

const TemplatesPage = () => {
  const { mockTemplates } = useRun(); // Get mockTemplates from context
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredTemplates = mockTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Templates</h1>
      <div className="relative">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{template.name}</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground mb-4">
                  Template ID: <span className="font-mono">{template.id}</span>
                </CardDescription>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/templates/${template.id}`}>
                    View Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center">No templates found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;