"use client";

import { updateClassStatusAction } from "@/app/actions/classes";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransition } from "react";
import { toast } from "sonner";

const statusMap = {
  DONE: { label: "Realizada", variant: "secondary" as const },
  SCHEDULED: { label: "Agendada", variant: "outline" as const },
  CANCELLED: { label: "Cancelada", variant: "destructive" as const },
};

export function ClassStatusButton({ classId, currentStatus }: { classId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const current = statusMap[currentStatus as keyof typeof statusMap] ?? statusMap.SCHEDULED;

  function changeStatus(status: string) {
    startTransition(async () => {
      const result = await updateClassStatusAction(classId, status);
      if (result?.error) toast.error(result.error);
      else toast.success("Status atualizado!");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isPending}>
        <Badge variant={current.variant} className="cursor-pointer">
          {isPending ? "..." : current.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeStatus("DONE")}>Realizada</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeStatus("SCHEDULED")}>Agendada</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeStatus("CANCELLED")}>Cancelada</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
