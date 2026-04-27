import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, User, Phone, Mail, Target, ClipboardList,
  Calendar, Plus, ChevronRight, Pencil
} from "lucide-react";
import { DeleteStudentButton } from "./DeleteStudentButton";
import { NewPlanDialog } from "./NewPlanDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id, userId: session.userId },
    include: {
      plans: { orderBy: { createdAt: "desc" } },
      classes: { orderBy: { date: "desc" }, take: 10 },
      workouts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) notFound();

  const activePlan = student.plans[0] ?? null;
  const remaining = activePlan ? activePlan.totalClasses - activePlan.doneClasses : null;
  const progress = activePlan
    ? Math.round((activePlan.doneClasses / activePlan.totalClasses) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/alunos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Alunos
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-gray-400 text-sm">
                Aluno desde {format(student.createdAt, "MMMM yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/alunos/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </Link>
            <DeleteStudentButton studentId={id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                {student.phone}
              </div>
            )}
            {student.email && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                {student.email}
              </div>
            )}
            {student.goal && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <Target className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                {student.goal}
              </div>
            )}
            {!student.phone && !student.email && !student.goal && (
              <p className="text-sm text-gray-400">Nenhuma informação adicional</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Plano Atual</CardTitle>
              <NewPlanDialog studentId={id} />
            </div>
          </CardHeader>
          <CardContent>
            {activePlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{activePlan.name}</p>
                  <Badge variant={remaining !== null && remaining <= 0 ? "destructive" : remaining !== null && remaining <= 3 ? "outline" : "secondary"}>
                    {remaining !== null && remaining <= 0 ? "Expirado" : remaining !== null && remaining <= 3 ? `${remaining} restante(s)` : "Ativo"}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500">
                  {activePlan.doneClasses} de {activePlan.totalClasses} aulas realizadas
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhum plano ativo</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              Últimas Aulas
            </CardTitle>
            <Link href={`/aulas/nova?studentId=${id}`}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Registrar Aula
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {student.classes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma aula registrada</p>
          ) : (
            <div className="space-y-2">
              {student.classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {format(cls.date, "dd 'de' MMMM yyyy", { locale: ptBR })}
                    </p>
                    {cls.notes && <p className="text-xs text-gray-400 truncate max-w-xs">{cls.notes}</p>}
                  </div>
                  <Badge variant={cls.status === "DONE" ? "secondary" : "outline"} className="text-xs">
                    {cls.status === "DONE" ? "Realizada" : cls.status === "CANCELLED" ? "Cancelada" : "Agendada"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-500" />
              Fichas de Treino
            </CardTitle>
            <Link href={`/alunos/${id}/treinos/novo`}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Nova Ficha
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {student.workouts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma ficha criada</p>
          ) : (
            <div className="space-y-2">
              {student.workouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/alunos/${id}/treinos/${workout.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{workout.name}</p>
                    {workout.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{workout.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
