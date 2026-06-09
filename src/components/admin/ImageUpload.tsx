import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadAssetAdmin } from "@/lib/uploads.functions";
import { useLocale } from "@/lib/i18n";

interface Props {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  className?: string;
  /** Square preview size in px */
  size?: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ImageUpload({ value, onChange, folder = "misc", accept = "image/*", className = "", size = 96 }: Props) {
  const isAr = useLocale((s) => s.locale === "ar");
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useServerFn(uploadAssetAdmin);
  const [busy, setBusy] = useState(false);

  const handlePick = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? "حجم الصورة أكبر من 10MB" : "File exceeds 10MB");
      return;
    }
    try {
      setBusy(true);
      const dataBase64 = await fileToBase64(file);
      const res = await upload({
        data: { folder, filename: file.name, contentType: file.type || "image/jpeg", dataBase64 },
      });
      onChange(res.url);
      toast.success(isAr ? "تم رفع الصورة" : "Image uploaded");
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل رفع الصورة" : "Upload failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div
        className="rounded-lg border border-border bg-muted/30 grid place-items-center overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        {value ? (
          <img
            src={value}
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value
              ? (isAr ? "تغيير الصورة" : "Change image")
              : (isAr ? "اختر صورة" : "Choose image")}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted flex items-center gap-1.5"
            >
              <X className="h-4 w-4" />{isAr ? "إزالة" : "Remove"}
            </button>
          )}
        </div>
        {value && (
          <p className="text-xs text-muted-foreground truncate" dir="ltr">{value}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePick(f);
          }}
        />
      </div>
    </div>
  );
}
