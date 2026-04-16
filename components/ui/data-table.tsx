"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

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
