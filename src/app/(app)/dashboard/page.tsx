import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, Calendar, CheckCircle, AlertTriangle, Plus, ChevronRight, Dumbbell
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [students, classesThisMonth, recentClasses, expiringPlans] = await Promise.all([
    prisma.student.findMany({
      where: { userId: session.userId },
      include: { plans: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),

    prisma.class.count({
      where: {
        student: { userId: session.userId },
        status: "DONE",
        date: { gte: monthStart, lte: monthEnd },
      },
    }),

    prisma.class.findMany({
      where: { student: { userId: session.userId } },
      include: { student: true },
      orderBy: { date: "desc" },
      take: 5,
    }),

    prisma.plan.findMany({
      where: {
        student: { userId: session.userId },
        doneClasses: { gt: 0 },
      },
      include: { student: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const activeStudents = students.filter((s) => {
    const plan = s.plans[0];
    if (!plan) return false;
    return plan.doneClasses < plan.totalClasses;
  });

  const expiring = expiringPlans.filter((p) => {
    const remaining = p.totalClasses - p.doneClasses;
    return remaining > 0 && remaining <= 3;
  });

  const expired = expiringPlans.filter((p) => p.doneClasses >= p.totalClasses);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {session.name.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(now, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Alunos ativos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeStudents.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aulas no mês</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{classesThisMonth}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Planos expirando</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{expiring.length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de alunos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{students.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(expiring.length > 0 || expired.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
              <AlertTriangle className="w-5 h-5" />
              Atenção — Planos com poucas aulas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...expiring, ...expired].slice(0, 5).map((plan) => {
              const remaining = plan.totalClasses - plan.doneClasses;
              const progress = Math.round((plan.doneClasses / plan.totalClasses) * 100);
              return (
                <Link
                  key={plan.id}
                  href={`/alunos/${plan.studentId}`}
                  className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{plan.student.name}</p>
                      <Badge variant={remaining <= 0 ? "destructive" : "outline"} className="ml-2 shrink-0">
                        {remaining <= 0 ? "Expirado" : `${remaining} aula(s)`}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-gray-400 mt-1">{plan.name} · {plan.doneClasses}/{plan.totalClasses}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                Últimas Aulas
              </CardTitle>
              <Link href="/aulas/nova">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Nova
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentClasses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma aula ainda</p>
            ) : (
              <div className="space-y-2">
                {recentClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cls.student.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(cls.date, "dd/MM/yyyy")}
                        {cls.duration && ` · ${cls.duration}min`}
                      </p>
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
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Alunos Recentes
              </CardTitle>
              <Link href="/alunos/novo">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Novo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum aluno cadastrado</p>
            ) : (
              <div className="space-y-2">
                {students.slice(0, 5).map((student) => {
                  const plan = student.plans[0];
                  const remaining = plan ? plan.totalClasses - plan.doneClasses : null;
                  return (
                    <Link
                      key={student.id}
                      href={`/alunos/${student.id}`}
                      className="flex items-center justify-between py-1.5 hover:opacity-80 transition-opacity"
                    >
                      <p className="text-sm font-medium text-gray-800">{student.name}</p>
                      {remaining !== null && (
                        <Badge
                          variant={remaining <= 0 ? "destructive" : remaining <= 3 ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {remaining <= 0 ? "Expirado" : `${remaining} aulas`}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
