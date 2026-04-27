"use client";

import { deleteMediaAction } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

export function DeleteMediaButton({ mediaId }: { mediaId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMediaAction(mediaId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      onClick={handleDelete}
      disabled={isPending}
      className="h-6 w-6 p-0 rounded-full"
    >
      <X className="w-3 h-3" />
    </Button>
  );
}
