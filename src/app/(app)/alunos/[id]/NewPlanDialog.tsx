"use client";

import { createPlanAction } from "@/app/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function NewPlanDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPlanAction(studentId, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Plano criado com sucesso!");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 h-7 px-2">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Novo plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Plano</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="planDialogName">Nome do plano</Label>
            <Input id="planDialogName" name="name" placeholder="Ex: Plano Mensal" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planDialogTotal">Total de aulas</Label>
            <Input id="planDialogTotal" name="totalClasses" type="number" min={1} placeholder="Ex: 20" required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Salvando..." : "Criar Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
