"use client";

import { addMediaToExerciseAction } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

export function MediaUploader({ exerciseId }: { exerciseId: string }) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await addMediaToExerciseAction(exerciseId, formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Mídia adicionada!");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="text-gray-500 text-xs"
      >
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {isPending ? "Enviando..." : "Adicionar foto/vídeo"}
      </Button>
    </div>
  );
}
