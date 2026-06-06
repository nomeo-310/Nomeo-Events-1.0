// events-update-seats-modal.tsx
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/reusable-modal";

export function UpdateSeatsModal({ isOpen, onClose, onConfirm, isLoading, currentTotal, currentAvailable }: {
  isOpen: boolean; onClose: () => void; onConfirm: (t?: number, a?: number) => void;
  isLoading: boolean; currentTotal: number; currentAvailable: number;
}) {
  const [total, setTotal] = useState(String(currentTotal));
  const [available, setAvailable] = useState(String(currentAvailable));
  useEffect(() => { setTotal(String(currentTotal)); setAvailable(String(currentAvailable)); }, [currentTotal, currentAvailable]);

  return (
    <ConfirmModal isOpen={isOpen} onClose={onClose} onConfirm={() => onConfirm(total ? Number(total) : undefined, available ? Number(available) : undefined)}
      title="Update Seat Capacity" description="Adjust total and available seats. Available seats cannot exceed total seats."
      confirmLabel="Update Seats" cancelLabel="Cancel" confirmVariant="primary" isLoading={isLoading} size="md">
      <div className="mt-4 space-y-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total Seats</Label>
          <Input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Available Seats</Label>
          <Input type="number" min={0} max={Number(total)} value={available} onChange={(e) => setAvailable(e.target.value)} className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
      </div>
    </ConfirmModal>
  );
}