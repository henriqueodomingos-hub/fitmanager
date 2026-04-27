"use client";

import { deleteExerciseAction } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

export function DeleteExerciseButton({ exerciseId }: { exerciseId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Remover este exercício?")) return;
    startTransition(async () => {
      const result = await deleteExerciseAction(exerciseId);
      if (result?.error) toast.error(result.error);
      else toast.success("Exercício removido.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-gray-400 hover:text-red-600 shrink-0"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
