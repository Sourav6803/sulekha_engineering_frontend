'use client';

import { useState, useMemo } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { customersApi } from '@/lib/api/customers.api';
import type { CustomerDocument } from '@/types/customer';

const ALL_DOCUMENT_TYPES = [
  { value: 'aadhar', label: 'Aadhar Card', icon: '🪪', required: true },
  { value: 'voterId', label: 'Voter ID', icon: '🪪', required: false },
  { value: 'panCard', label: 'PAN Card', icon: '💳', required: true },
  { value: 'passbookOrCheque', label: 'Passbook / Cheque', icon: '🏦', required: true },
  { value: 'electricBill', label: 'Electric Bill', icon: '⚡', required: false },
  { value: 'landRecord', label: 'Land Record', icon: '📄', required: true },
  { value: 'sitePhotoBefore', label: 'Site Photo Before', icon: '📷', required: true },
  { value: 'sitePhotoAfter', label: 'Site Photo After', icon: '📷', required: true },
  { value: 'loanApprovalLetter', label: 'Loan Approval Letter', icon: '📝', required: false },
  { value: 'rtsFeasibilityReport', label: 'RTS Feasibility Report', icon: '📊', required: true },
  { value: 'feasibilityApproval', label: 'Feasibility Approval', icon: '✅', required: true },
  { value: 'agreement', label: 'Agreement', icon: '📋', required: false },
  { value: 'quotation', label: 'Quotation', icon: '💰', required: false },
  { value: 'dcrCertificate', label: 'DCR Certificate', icon: '🏆', required: false },
  { value: 'panelSerialNumber', label: 'Panel Serial Number', icon: '🔢', required: false },
  // Filed as the government side of the process answers — not at intake, so none
  // of these are marked required.
  { value: 'eToken', label: 'eToken', icon: '🎫', required: false },
  { value: 'acknowledgement', label: 'Acknowledgement', icon: '🧾', required: false },
  { value: 'netMetering', label: 'Net Metering', icon: '🔌', required: false },
] as const;

interface DocumentUploadDialogProps {
  customerId: string;
  existingDocuments: CustomerDocument[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadDialog({ customerId, existingDocuments, open, onClose, onSuccess }: DocumentUploadDialogProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filesByType, setFilesByType] = useState<Record<string, File[]>>({});
  const [uploading, setUploading] = useState(false);

  const uploadedTypes = useMemo(() => new Set(existingDocuments.map(d => d.type)), [existingDocuments]);
  const availableTypes = useMemo(() => 
    ALL_DOCUMENT_TYPES.filter(t => !uploadedTypes.has(t.value)),
    [uploadedTypes]
  );

  if (!open) return null;

  const toggleType = (typeValue: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeValue) 
        ? prev.filter(t => t !== typeValue)
        : [...prev, typeValue]
    );
    setFilesByType(prev => {
      const next = { ...prev };
      delete next[typeValue];
      return next;
    });
  };

  const handleFileChange = (typeValue: string, fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    setFilesByType(prev => ({
      ...prev,
      [typeValue]: [...(prev[typeValue] || []), ...files]
    }));
  };

  const removeFile = (typeValue: string, index: number) => {
    setFilesByType(prev => ({
      ...prev,
      [typeValue]: prev[typeValue].filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one document type');
      return;
    }

    const hasFiles = selectedTypes.some(type => filesByType[type]?.length > 0);
    if (!hasFiles) {
      toast.error('Please select files for at least one document type');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = selectedTypes.flatMap(type => {
        const files = filesByType[type] || [];
        return files.map(file => {
          const formData = new FormData();
          formData.append('documents', file);
          formData.append('type', type);
          return customersApi.uploadDocument(customerId, formData);
        });
      });

      await Promise.all(uploadPromises);
      toast.success(`Successfully uploaded ${uploadPromises.length} document(s)`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to upload some documents');
    } finally {
      setUploading(false);
    }
  };

  const totalSelectedFiles = Object.values(filesByType).reduce((sum, files) => sum + files.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--border-soft)] bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Upload Documents</h3>
              <p className="text-sm text-[var(--muted)]">
                {availableTypes.length} document type{availableTypes.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {availableTypes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
                <FileText className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-medium text-[var(--foreground)]">All documents uploaded</p>
              <p className="mt-1 text-sm text-[var(--muted)]">All required documents have been uploaded successfully.</p>
            </div>
          ) : (
            <>
              {/* Document Type Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableTypes.map(type => {
                  const isSelected = selectedTypes.includes(type.value);
                  const files = filesByType[type.value] || [];
  return (
                    <div
                      key={type.value}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary-tint)]'
                          : 'border-[var(--border-soft)] bg-white hover:border-[var(--primary)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--foreground)]">{type.label}</p>
                            {type.required && (
                              <span className="text-xs text-[var(--error)]">*</span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted-soft)] mt-0.5">
                            {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleType(type.value)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                              : 'border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                        <label
                          className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium cursor-pointer transition-colors ${
                            isSelected
                              ? 'border border-[var(--primary)] bg-white text-[var(--primary)] hover:bg-[var(--primary-tint)]'
                              : 'border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] cursor-not-allowed'
                          }`}
                        >
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={!isSelected}
                            onChange={(e) => handleFileChange(type.value, e.target.files)}
                          />
                          Browse
                        </label>
                      </div>

                      {/* Selected Files */}
                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-[var(--foreground)] truncate">{file.name}</p>
                                <p className="text-xs text-[var(--muted-soft)]">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(type.value, index)}
                                className="ml-2 rounded p-1 text-[var(--muted)] hover:text-[var(--error)]"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upload Summary */}
              {totalSelectedFiles > 0 && (
                <div className="rounded-xl border border-[var(--primary)] bg-[var(--primary-tint)] p-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-[var(--primary)]" />
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Ready to upload {totalSelectedFiles} file{totalSelectedFiles > 1 ? 's' : ''} for {selectedTypes.length} document type{selectedTypes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-[var(--border-soft)] bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="neutral-button"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || totalSelectedFiles === 0}
              className="brand-button"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {totalSelectedFiles > 0 ? `${totalSelectedFiles} file${totalSelectedFiles > 1 ? 's' : ''}` : 'Documents'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
