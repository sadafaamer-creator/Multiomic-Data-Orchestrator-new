import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  Download,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationIssue {
  id: string;
  severity: "blocker" | "warning" | "info";
  row: number;
  column: string;
  ruleId: string;
  description: string;
  context?: string;
}

interface ValidationResultsProps {
  validationData: {
    blockerCount: number;
    warningCount: number;
    infoCount: number;
    issues: ValidationIssue[];
  };
  onDownloadReport: () => void;
  onReupload: () => void;
}

const getSeverityIcon = (severity: ValidationIssue["severity"]) => {
  switch (severity) {
    case "blocker":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
};

const getSeverityColorClass = (severity: ValidationIssue["severity"]) => {
  switch (severity) {
    case "blocker":
      return "bg-red-50 text-red-800 hover:bg-red-100";
    case "warning":
      return "bg-amber-50 text-amber-800 hover:bg-amber-100";
    case "info":
      return "bg-blue-50 text-blue-800 hover:bg-blue-100";
    default:
      return "";
  }
};

const ValidationResults: React.FC<ValidationResultsProps> = ({
  validationData,
  onDownloadReport,
  onReupload,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const columns: ColumnDef<ValidationIssue>[] = [
    {
      accessorKey: "severity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0"
        >
          Severity
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getSeverityIcon(row.original.severity)}
          <Badge variant="outline" className={getSeverityColorClass(row.original.severity)}>
            {row.original.severity}
          </Badge>
        </div>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "row",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0"
        >
          Row #
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("row")}</div>,
    },
    {
      accessorKey: "column",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0"
        >
          Column
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("column")}</div>,
      filterFn: "includesString",
    },
    {
      accessorKey: "ruleId",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0"
        >
          Rule ID
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("ruleId")}</div>,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-md text-sm text-muted-foreground">
          {row.getValue("description")}
        </div>
      ),
      filterFn: "includesString",
    },
  ];

  const table = useReactTable({
    data: validationData.issues,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const isReadyToExport = validationData.blockerCount === 0;

  // Mock data for filters
  const uniqueRuleIds = Array.from(new Set(validationData.issues.map((issue) => issue.ruleId)));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Validation Results</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Blockers</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {validationData.blockerCount}
            </div>
            <p className="text-xs text-red-600">Issues preventing export</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {validationData.warningCount}
            </div>
            <p className="text-xs text-amber-600">Advisory issues</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {validationData.infoCount}
            </div>
            <p className="text-xs text-blue-600">Informational messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Select
          value={(table.getColumn("severity")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("severity")?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="blocker">Blocker</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("ruleId")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("ruleId")?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Rule ID" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rule IDs</SelectItem>
            {uniqueRuleIds.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by Column..."
          value={(table.getColumn("column")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("column")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Results Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Accordion
                  type="single"
                  collapsible
                  key={row.id}
                  className="w-full"
                >
                  <AccordionItem value={row.id} className="border-b">
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        getSeverityColorClass(row.original.severity),
                        "hover:bg-opacity-70 transition-colors"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                      <TableCell className="w-12">
                        {row.original.context && (
                          <AccordionTrigger className="p-0 h-auto data-[state=open]:rotate-180 transition-transform duration-200">
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </AccordionTrigger>
                        )}
                      </TableCell>
                    </TableRow>
                    {row.original.context && (
                      <AccordionContent className="bg-muted/50 p-4 text-sm text-muted-foreground">
                        <p className="font-semibold mb-1">Context/Remediation:</p>
                        <p>{row.original.context}</p>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                </Accordion>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>
            {/* Simplified pagination for brevity, can be expanded */}
            <PaginationItem>
              <PaginationLink isActive>
                {table.getState().pagination.pageIndex + 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={onReupload}
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Upload className="mr-2 h-4 w-4" />
          Fix and Re-upload
        </Button>
        <Button
          onClick={onDownloadReport}
          disabled={!isReadyToExport && validationData.blockerCount > 0}
          className={cn(
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            !isReadyToExport && "opacity-50 cursor-not-allowed"
          )}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Validation Report (CSV)
        </Button>
      </div>
    </div>
  );
};

export default ValidationResults;