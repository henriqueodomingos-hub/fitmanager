import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, ChevronRight } from "lucide-react";

function getPlanStatus(plan: { totalClasses: number; doneClasses: number } | null) {
  if (!plan) return { label: "Sem plano", color: "secondary" as const };
  const remaining = plan.totalClasses - plan.doneClasses;
  if (remaining <= 0) return { label: "Expirado", color: "destructive" as const };
  if (remaining <= 3) return { label: `${remaining} aula(s)`, color: "default" as const };
  return { label: "Ativo", color: "default" as const };
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q } = await searchParams;

  const students = await prisma.student.findMany({
    where: {
      userId: session.userId,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: {
      plans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} aluno(s) cadastrado(s)</p>
        </div>
        <Link href="/alunos/novo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      <form className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input name="q" defaultValue={q} placeholder="Buscar aluno..." className="pl-9" />
        </div>
      </form>

      {students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum aluno encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Cadastre seu primeiro aluno para começar</p>
          <Link href="/alunos/novo" className="mt-4 inline-block">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Aluno
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const plan = student.plans[0] ?? null;
            const status = getPlanStatus(plan);
            const remaining = plan ? plan.totalClasses - plan.doneClasses : null;

            return (
              <Link
                key={student.id}
                href={`/alunos/${student.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{student.name}</p>
                  <p className="text-sm text-gray-400 truncate">{student.phone ?? student.email ?? "Sem contato"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {plan && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">Aulas</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {plan.doneClasses}/{plan.totalClasses}
                      </p>
                    </div>
                  )}
                  <Badge
                    variant={
                      remaining !== null && remaining <= 0
                        ? "destructive"
                        : remaining !== null && remaining <= 3
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {status.label}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
