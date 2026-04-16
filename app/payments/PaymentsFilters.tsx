'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onApply: () => void;
}

export function PaymentsFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onApply,
}: PaymentsFiltersProps) {
  return (
    <div
      className="mb-5 flex animate-fadeup flex-col gap-3 sm:flex-row"
      style={{ animationDelay: '0.07s' }}
    >
      <Input
        placeholder="Search by payer name or payment ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:max-w-md"
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onApply} variant="outline" className="w-full sm:w-auto">
        Apply Filters
      </Button>
    </div>
  );
}
