"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// DATA TABLE COMPONENTS
// Reusable table components to avoid repetition across the codebase
// ============================================================================

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

// Table Header Row - renders all column headers with consistent styling
interface DataTableHeaderProps {
  columns: TableColumn[];
  className?: string;
}

export function DataTableHeader({ columns, className }: DataTableHeaderProps) {
  return (
    <thead>
      <tr className={cn("border-b bg-muted/50", className)}>
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              "px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground",
              column.align === 'right' && "text-right",
              column.align === 'center' && "text-center",
              column.align !== 'right' && column.align !== 'center' && "text-left",
              column.className
            )}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Table Cell - consistent cell styling
interface DataTableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function DataTableCell({ children, className, align = 'left' }: DataTableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm text-foreground",
        align === 'right' && "text-right",
        align === 'center' && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

// Table Row with hover state
interface DataTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b hover:bg-muted/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

// Empty state for tables
interface DataTableEmptyProps {
  colSpan: number;
  message: string;
  action?: React.ReactNode;
}

export function DataTableEmpty({ colSpan, message, action }: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="text-sm text-muted-foreground">{message}</div>
        {action && <div className="mt-2">{action}</div>}
      </td>
    </tr>
  );
}

// Loading state for tables
interface DataTableLoadingProps {
  colSpan: number;
  message?: string;
}

export function DataTableLoading({ colSpan, message = "Loading..." }: DataTableLoadingProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

// Full Data Table wrapper
interface DataTableProps {
  columns: TableColumn[];
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable({ columns, children, className, headerClassName }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <DataTableHeader columns={columns} className={headerClassName} />
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
