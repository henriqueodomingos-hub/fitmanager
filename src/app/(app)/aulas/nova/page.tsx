import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NovaAulaForm } from "./NovaAulaForm";

export default async function NovaAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studentId } = await searchParams;

  const students = await prisma.student.findMany({
    where: { userId: session.userId },
    include: { plans: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <NovaAulaForm students={students} defaultStudentId={studentId} />
    </div>
  );
}
