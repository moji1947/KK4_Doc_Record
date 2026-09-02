import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeDescriptionCombobox } from "@/components/shared/CodeDescriptionCombobox";
import { useAllMasterData } from "@/features/master-data/api/useMasterData";
import {
  DocumentRecord,
  useSubmitRevision,
} from "@/features/documents/api/useDocuments";

const submitRevisionSchema = z.object({
  revision: z.string().min(1, "Revision code is required"),
  submittedDate: z.string().min(1, "Submitted Date is required"),
  purposeCode: z.string().min(1, "Purpose of Issue is required"),
  submittedBy: z.string().min(1, "Submitted By is required"),
  receivedBy: z.string().optional(),
  returnCode: z.string().optional(),
  updateDocumentStatus: z.string().default("SUBMITTED"),
});

type SubmitRevisionFormData = z.infer<typeof submitRevisionSchema>;

interface SubmitRevisionModalProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmitRevisionModal({
  document,
  isOpen,
  onClose,
  onSuccess,
}: SubmitRevisionModalProps) {
  const { data: masterData } = useAllMasterData();
  const submitRevisionMutation = useSubmitRevision();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubmitRevisionFormData>({
    resolver: zodResolver(submitRevisionSchema),
    defaultValues: {
      revision: "",
      submittedDate: new Date().toISOString().slice(0, 10),
      purposeCode: "IFR",
      submittedBy: "somchai.me@scg.com",
      receivedBy: "admin@scg.com",
      returnCode: "",
      updateDocumentStatus: "SUBMITTED",
    },
  });

  React.useEffect(() => {
    if (isOpen && document) {
      // Suggest next revision
      const currentRev = document.currentRevision;
      let nextRev = "A2";
      if (currentRev === "A1") nextRev = "A2";
      else if (currentRev === "A2") nextRev = "B1";
      else if (currentRev === "B1") nextRev = "B2";
      else if (currentRev === "B2") nextRev = "C1";

      reset({
        revision: nextRev,
        submittedDate: new Date().toISOString().slice(0, 10),
        purposeCode: "IFR",
        submittedBy: "somchai.me@scg.com",
        receivedBy: "admin@scg.com",
        returnCode: "",
        updateDocumentStatus: "SUBMITTED",
      });
    }
  }, [isOpen, document, reset]);

  if (!document) return null;

  const onSubmit = async (formData: SubmitRevisionFormData) => {
    try {
      await submitRevisionMutation.mutateAsync({
        documentId: document.documentId,
        revision: formData.revision,
        submittedDate: new Date(formData.submittedDate).toISOString(),
        purposeCode: formData.purposeCode,
        submittedBy: formData.submittedBy,
        receivedBy: formData.receivedBy || null,
        returnCode: formData.returnCode || null,
        updateDocumentStatus: formData.updateDocumentStatus,
      });

      onClose();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to submit revision:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit New Revision"
      description={`Record new submission transmittal for ${document.documentNo}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Document Banner */}
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-slate-100">
              {document.documentNo}
            </span>
            <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">
              {document.title}
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
            Current: Rev {document.currentRevision}
          </span>
        </div>

        {/* Revision & Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Controller
            control={control}
            name="revision"
            render={({ field }) => (
              <CodeDescriptionCombobox
                label="New Revision"
                required
                options={
                  masterData?.revisions.map((r) => ({
                    code: r.revisionCode,
                    description: r.revisionDescription,
                  })) || []
                }
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Revision"
                error={errors.revision?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="purposeCode"
            render={({ field }) => (
              <CodeDescriptionCombobox
                label="Purpose of Issue"
                required
                options={
                  masterData?.purposes.map((p) => ({
                    code: p.purposeCode,
                    description: p.purposeDescription,
                  })) || []
                }
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Purpose"
                error={errors.purposeCode?.message}
              />
            )}
          />
        </div>

        {/* Submission Date & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Submission Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              {...register("submittedDate")}
              className="h-10 text-xs text-slate-200"
            />
            {errors.submittedDate && (
              <p className="text-xs text-rose-400">{errors.submittedDate.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="updateDocumentStatus"
            render={({ field }) => (
              <CodeDescriptionCombobox
                label="Update Status To"
                options={
                  masterData?.statuses.map((s) => ({
                    code: s.statusCode,
                    description: s.statusName,
                  })) || []
                }
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Status"
              />
            )}
          />
        </div>

        {/* Submitted By & Received By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Submitted By <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("submittedBy")}
              placeholder="e.g. somchai.me@scg.com"
              className="h-10 text-xs text-slate-200"
            />
            {errors.submittedBy && (
              <p className="text-xs text-rose-400">{errors.submittedBy.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Received By
            </label>
            <Input
              {...register("receivedBy")}
              placeholder="e.g. admin@scg.com"
              className="h-10 text-xs text-slate-200"
            />
          </div>
        </div>

        {/* Return Code (Optional) */}
        <Controller
          control={control}
          name="returnCode"
          render={({ field }) => (
            <CodeDescriptionCombobox
              label="Return Code (Optional)"
              options={
                masterData?.returnCodes.map((r) => ({
                  code: r.returnCode,
                  description: r.returnDescription,
                })) || []
              }
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="None / Pending Review"
            />
          )}
        />

        {/* Error notification */}
        {submitRevisionMutation.isError && (
          <div className="flex items-center space-x-2 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              {submitRevisionMutation.error instanceof Error
                ? submitRevisionMutation.error.message
                : "Failed to submit revision."}
            </span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="scg"
            size="sm"
            disabled={submitRevisionMutation.isPending}
            className="min-w-[120px]"
          >
            {submitRevisionMutation.isPending ? (
              "Recording..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Submit Revision
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
