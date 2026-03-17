"use client";

import { useMemo, useState } from "react";
import { Download, FileText, ImageIcon } from "lucide-react";
import { CommunityPostAttachment } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PostAttachmentsProps {
  attachments: CommunityPostAttachment[];
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment: CommunityPostAttachment) {
  return attachment.contentType?.startsWith("image/");
}

export function PostAttachments({ attachments }: PostAttachmentsProps) {
  const [selectedImage, setSelectedImage] = useState<CommunityPostAttachment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const triggerDownload = (attachment: CommunityPostAttachment) => {
    if (!attachment.downloadUrl) {
      return;
    }
    setDownloadingId(attachment.id);
    window.location.assign(attachment.downloadUrl);
    setTimeout(() => setDownloadingId((current) => (current === attachment.id ? null : current)), 1200);
  };

  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => (attachment.viewUrl || attachment.downloadUrl) && isImageAttachment(attachment)),
    [attachments],
  );
  const fileAttachments = useMemo(
    () => attachments.filter((attachment) => !isImageAttachment(attachment)),
    [attachments],
  );

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {imageAttachments.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imageAttachments.map((attachment) => (
            <div key={attachment.id} className="overflow-hidden rounded-md border bg-muted/20">
              <button
                type="button"
                className="group relative block w-full"
                onClick={() => setSelectedImage(attachment)}
              >
                <img
                  src={attachment.viewUrl || attachment.downloadUrl}
                  alt={attachment.fileName}
                  className="h-40 w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
              </button>
              <div className="flex items-center gap-2 border-t p-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="flex-1 truncate text-sm font-medium">{attachment.fileName}</p>
                {attachment.downloadUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={downloadingId === attachment.id}
                    onClick={() => triggerDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className="space-y-2">
          {fileAttachments.map((attachment) => (
            <div key={attachment.id} className="rounded-md border">
              {attachment.downloadUrl ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40"
                  onClick={() => triggerDownload(attachment)}
                  disabled={downloadingId === attachment.id}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-0 bg-black/95 p-2 sm:p-3">
          <DialogHeader>
            <DialogTitle className="truncate pr-8 text-sm text-white">{selectedImage?.fileName}</DialogTitle>
          </DialogHeader>
          {selectedImage?.downloadUrl && (
            <img
              src={selectedImage.viewUrl || selectedImage.downloadUrl}
              alt={selectedImage.fileName}
              className="max-h-[80vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
