"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadIcon, Trash2Icon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload-image";
import { deleteImage } from "@/actions/resource.action";

export function MediaStep() {
  const { watch, setValue } = useFormContext();
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const banner = watch("banner");

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await uploadImage({
        image: file,
        uploadPreset: "nomeo_events_events",
      });
      if (result?.secure_url && result?.public_id) {
        setValue("banner", {
          secure_url: result.secure_url,
          public_id:  result.public_id,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!banner?.public_id) {
      setValue("banner", null);
      return;
    }
    try {
      setDeleting(true);
      await deleteImage(banner.public_id);
      setValue("banner", null);
    } catch (error) {
      console.error("Delete error:", error);
      // Clear from form even if cloudinary call fails
      setValue("banner", null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Event Banner</Label>
        <div className="mt-1.5">
          {banner?.secure_url ? (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={banner.secure_url}
                alt="Event banner"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleDelete}
                >
                  {deleting ? (
                    <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="w-4 h-4" />
                  )}
                  {deleting ? "Deleting..." : "Remove Banner"}
                </Button>
              </div>
              {/* Always-visible delete button fallback for mobile */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                className="absolute top-2 right-2 sm:hidden"
                onClick={handleDelete}
              >
                {deleting
                  ? <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" />
                  : <Trash2Icon className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="banner-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  // Reset input so same file can be re-selected after delete
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="banner-upload"
                className="cursor-pointer inline-flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="w-8 h-8 animate-spin text-indigo-600" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload banner image</span>
                    <span className="text-xs text-muted-foreground/70">PNG, JPG, WEBP up to 10MB</span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}