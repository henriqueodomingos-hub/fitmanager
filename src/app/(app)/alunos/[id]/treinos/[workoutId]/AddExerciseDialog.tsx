"use client";

import { addExerciseAction } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";

export function AddExerciseDialog({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addExerciseAction(workoutId, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Exercício adicionado!");
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Exercício
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Exercício</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="exName">Nome do exercício *</Label>
            <Input id="exName" name="name" placeholder="Ex: Supino Reto" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sets">Séries</Label>
              <Input id="sets" name="sets" type="number" min={1} placeholder="4" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Repetições</Label>
              <Input id="reps" name="reps" placeholder="12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Carga</Label>
              <Input id="weight" name="weight" placeholder="20kg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tip">Dica de execução</Label>
            <Textarea id="tip" name="tip" placeholder="Ex: Mantenha os cotovelos a 45°..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="media">Fotos/Vídeos demonstrativos</Label>
            <Input id="media" name="media" type="file" accept="image/*,video/*" multiple />
            <p className="text-xs text-gray-400">Você pode adicionar mais mídias depois também</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
