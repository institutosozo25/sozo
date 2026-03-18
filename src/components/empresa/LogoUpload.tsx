import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Loader2, Building2 } from "lucide-react";

interface LogoUploadProps {
  userId: string;
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  empresaId: string;
}

export default function LogoUpload({ userId, currentLogoUrl, onLogoChange, empresaId }: LogoUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie uma imagem (PNG, JPG, WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O logo deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      const logoUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from("empresas")
        .update({ logo_url: logoUrl })
        .eq("id", empresaId);

      if (dbError) throw dbError;

      onLogoChange(logoUrl);
      toast({ title: "Logo atualizado!" });
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast({ title: "Erro ao enviar logo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const { data: files } = await supabase.storage
        .from("company-logos")
        .list(userId);

      if (files?.length) {
        await supabase.storage
          .from("company-logos")
          .remove(files.map(f => `${userId}/${f.name}`));
      }

      await supabase.from("empresas").update({ logo_url: null }).eq("id", empresaId);
      onLogoChange(null);
      toast({ title: "Logo removido." });
    } catch (err: any) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 overflow-hidden">
        {currentLogoUrl ? (
          <img src={currentLogoUrl} alt="Logo da empresa" className="h-full w-full object-contain p-1" />
        ) : (
          <Building2 className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Logo da Empresa</p>
        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP · Máx. 2MB</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {currentLogoUrl ? "Trocar" : "Enviar"}
          </Button>
          {currentLogoUrl && (
            <Button variant="ghost" size="sm" onClick={handleRemove} disabled={uploading} className="gap-1 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" /> Remover
            </Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
    </div>
  );
}
