import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, User, ChevronRight, Dumbbell } from "lucide-react";

export default async function TreinosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const workouts = await prisma.workout.findMany({
    where: { student: { userId: session.userId } },
    include: {
      student: true,
      exercises: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Treinos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {workouts.length} ficha(s) de treino no total
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma ficha de treino criada</p>
          <p className="text-gray-400 text-sm mt-1">
            Acesse um aluno e crie a primeira ficha de treino
          </p>
          <Link href="/alunos" className="mt-4 inline-block">
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
              Ver Alunos
            </Badge>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/alunos/${workout.studentId}/treinos/${workout.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{workout.name}</p>
                <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-400">
                  <User className="w-3.5 h-3.5" />
                  {workout.student.name}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{workout.exercises.length} exercício(s)</Badge>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
