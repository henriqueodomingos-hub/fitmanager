"use client";

import { createClassAction } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface Student {
  id: string;
  name: string;
  plans: { id: string; name: string; totalClasses: number; doneClasses: number }[];
}

export function NovaAulaForm({ students, defaultStudentId }: { students: Student[]; defaultStudentId?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId ?? "");

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const activePlan = selectedStudent?.plans[0] ?? null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createClassAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  const today = new Date().toISOString().slice(0, 16);

  return (
    <>
      <div className="mb-6">
        <Link href="/aulas" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Aulas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Aula</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes da Aula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Aluno *</Label>
              <Select
                name="studentId"
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activePlan && (
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select name="planId" defaultValue={activePlan.id}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={activePlan.id}>
                      {activePlan.name} ({activePlan.doneClasses}/{activePlan.totalClasses} aulas)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data e hora *</Label>
                <Input id="date" name="date" type="datetime-local" defaultValue={today} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input id="duration" name="duration" type="number" min={1} placeholder="60" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="DONE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DONE">Realizada</SelectItem>
                  <SelectItem value="SCHEDULED">Agendada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" placeholder="Observações da aula..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Link href="/aulas" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancelar</Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Salvando..." : "Registrar Aula"}
          </Button>
        </div>
      </form>
    </>
  );
}
