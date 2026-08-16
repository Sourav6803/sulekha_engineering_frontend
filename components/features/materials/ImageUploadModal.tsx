'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import type { MaterialDocument } from '@/types/material';

interface ImageUploadModalProps {
  open: boolean;
  material: MaterialDocument | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void> | void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

/**
 * Modal for uploading a single material image with local preview and
 * client-side validation (type + size) before it hits the backend.
 *
 * Internal state is reset via React's "adjust state during render" pattern
 * whenever the modal opens for a different material, and on explicit close,
 * so each session starts fresh without effects calling setState.
 */
export function ImageUploadModal({ open, material, busy = false, onClose, onSubmit }: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const revokePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  // Revoke any lingering object URL when the modal unmounts (the parent only
  // mounts this component while open, so each open starts with fresh state).
  useEffect(() => {
    return () => revokePreview();
  }, []);

  const handleClose = () => {
    if (busy) return;
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    revokePreview();
    onClose();
  };

  const handleSelect = (selected: File | undefined) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Only JPEG, PNG, WebP or GIF images are allowed.');
      setFile(null);
      revokePreview();
      setPreviewUrl(null);
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be ${MAX_SIZE_MB}MB or smaller.`);
      setFile(null);
      revokePreview();
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setFile(selected);
    revokePreview();
    const url = URL.createObjectURL(selected);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please choose an image to upload.');
      return;
    }
    setError(null);
    void onSubmit(file);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={material ? `Add image — ${material.name}` : 'Add image'}
      eyebrow="Material image"
      size="sm"
      footer={
        <>
          <button type="button" className="neutral-button" onClick={handleClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="image-upload-form" className="brand-button" disabled={busy || !file}>
            {busy ? 'Uploading…' : 'Upload image'}
          </button>
        </>
      }
    >
      <form id="image-upload-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-10 text-center transition-colors hover:border-[var(--primary)]"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Material image preview" className="max-h-52 rounded-[var(--radius-sm)] object-contain" />
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--primary)]">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium text-[var(--foreground)]">Click to choose an image</span>
              <span className="text-xs text-[var(--muted-soft)]">JPEG, PNG, WebP or GIF · up to {MAX_SIZE_MB}MB</span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => handleSelect(e.target.files?.[0])}
        />

        {file && <p className="text-xs text-[var(--muted)]">{file.name}</p>}
      </form>
    </Modal>
  );
}
