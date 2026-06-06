// verifications-modals.tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
} from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal, ActionModal } from "@/components/ui/reusable-modal";

interface BulkVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading: boolean;
}

export const BulkVerifyModal = ({ isOpen, onClose, onConfirm, selectedCount, isLoading }: BulkVerifyModalProps) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Bulk Verification"
    description={`You are about to verify ${selectedCount} pending verification request${selectedCount !== 1 ? 's' : ''}.`}
    confirmLabel={`Verify ${selectedCount} Account${selectedCount !== 1 ? 's' : ''}`}
    cancelLabel="Cancel"
    confirmVariant="danger"
    isLoading={isLoading}
    size="md"
  >
    <div className="flex gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg mt-4">
      <HugeiconsIcon icon={CheckCircleIcon} className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">Verifying these accounts will:</p>
        <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
          <li>• Mark their verification status as "verified"</li>
          <li>• Send email notifications to all verified users</li>
          <li>• Allow them to create and publish events</li>
          <li>• Update their document verification status</li>
        </ul>
      </div>
    </div>
  </ConfirmModal>
);

interface BulkRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading: boolean;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
}

export const BulkRejectModal = ({ isOpen, onClose, onConfirm, selectedCount, isLoading, rejectReason, setRejectReason }: BulkRejectModalProps) => (
  <ActionModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onConfirm}
    title="Bulk Rejection"
    description={`You are about to reject ${selectedCount} pending verification request${selectedCount !== 1 ? 's' : ''}.`}
    actionLabel={`Reject ${selectedCount} Account${selectedCount !== 1 ? 's' : ''}`}
    cancelLabel="Cancel"
    actionVariant="danger"
    isLoading={isLoading}
    disabled={!rejectReason.trim()}
    size="md"
  >
    <div className="space-y-4">
      <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg">
        <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1.5">Rejecting these accounts will:</p>
          <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
            <li>• Mark their verification status as "rejected"</li>
            <li>• Send rejection emails with the provided reason</li>
            <li>• Require users to resubmit verification documents</li>
          </ul>
        </div>
      </div>
      
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Reason for Rejection (will be sent to all selected users)
        </Label>
        <Textarea
          placeholder="Enter the reason why these verification requests are being rejected..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          rows={4}
        />
        <p className="text-xs text-red-500 dark:text-red-400 mt-2">
          This reason will be sent to all {selectedCount} user{selectedCount !== 1 ? 's' : ''} via email and notification.
        </p>
      </div>
    </div>
  </ActionModal>
);