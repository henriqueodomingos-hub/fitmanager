import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassStatusButton } from "./ClassStatusButton";

export default async function AulasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const classes = await prisma.class.findMany({
    where: { student: { userId: session.userId } },
    include: { student: true, plan: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  const done = classes.filter((c) => c.status === "DONE");
  const scheduled = classes.filter((c) => c.status === "SCHEDULED");
  const cancelled = classes.filter((c) => c.status === "CANCELLED");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aulas</h1>
          <p className="text-gray-500 text-sm mt-1">Histórico e controle de aulas</p>
        </div>
        <Link href="/aulas/nova">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Aula
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{done.length}</p>
            <p className="text-xs text-gray-500">Realizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <Clock className="w-7 h-7 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{scheduled.length}</p>
            <p className="text-xs text-gray-500">Agendadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <XCircle className="w-7 h-7 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{cancelled.length}</p>
            <p className="text-xs text-gray-500">Canceladas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-gray-500" />
            Todas as Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma aula registrada ainda</p>
              <Link href="/aulas/nova" className="mt-3 inline-block">
                <Button size="sm">Registrar primeira aula</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{cls.student.name}</p>
                      {cls.plan && (
                        <span className="text-xs text-gray-400 truncate hidden sm:block">· {cls.plan.name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {format(cls.date, "dd/MM/yyyy")}
                      {cls.duration && ` · ${cls.duration} min`}
                      {cls.notes && ` · ${cls.notes}`}
                    </p>
                  </div>
                  <ClassStatusButton classId={cls.id} currentStatus={cls.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
