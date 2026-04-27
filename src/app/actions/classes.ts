"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClassAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const studentId = formData.get("studentId") as string;
  const planId = formData.get("planId") as string;
  const dateStr = formData.get("date") as string;
  const duration = formData.get("duration") as string;
  const notes = formData.get("notes") as string;
  const status = (formData.get("status") as string) || "DONE";

  if (!studentId || !dateStr) return { error: "Aluno e data são obrigatórios." };

  const student = await prisma.student.findUnique({
    where: { id: studentId, userId: session.userId },
  });
  if (!student) return { error: "Aluno não encontrado." };

  await prisma.class.create({
    data: {
      studentId,
      planId: planId || null,
      date: new Date(dateStr),
      duration: duration ? parseInt(duration, 10) : null,
      notes: notes || null,
      status,
    },
  });

  if (status === "DONE" && planId) {
    await prisma.plan.update({
      where: { id: planId },
      data: { doneClasses: { increment: 1 } },
    });
  }

  revalidatePath("/aulas");
  revalidatePath(`/alunos/${studentId}`);
  revalidatePath("/dashboard");
  redirect("/aulas");
}

export async function updateClassStatusAction(classId: string, status: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { student: true },
  });
  if (!cls || cls.student.userId !== session.userId) return { error: "Não encontrado." };

  const oldStatus = cls.status;
  await prisma.class.update({ where: { id: classId }, data: { status } });

  if (cls.planId) {
    if (status === "DONE" && oldStatus !== "DONE") {
      await prisma.plan.update({ where: { id: cls.planId }, data: { doneClasses: { increment: 1 } } });
    } else if (oldStatus === "DONE" && status !== "DONE") {
      await prisma.plan.update({ where: { id: cls.planId }, data: { doneClasses: { decrement: 1 } } });
    }
  }

  revalidatePath("/aulas");
  revalidatePath(`/alunos/${cls.studentId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteClassAction(classId: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { student: true },
  });
  if (!cls || cls.student.userId !== session.userId) return { error: "Não encontrado." };

  if (cls.status === "DONE" && cls.planId) {
    await prisma.plan.update({ where: { id: cls.planId }, data: { doneClasses: { decrement: 1 } } });
  }

  await prisma.class.delete({ where: { id: classId } });
  revalidatePath("/aulas");
  revalidatePath(`/alunos/${cls.studentId}`);
  return { success: true };
}
