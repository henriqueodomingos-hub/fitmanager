"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStudentAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const goal = formData.get("goal") as string;
  const planName = formData.get("planName") as string;
  const totalClasses = parseInt(formData.get("totalClasses") as string, 10);

  if (!name) return { error: "Nome é obrigatório." };

  const student = await prisma.student.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      goal: goal || null,
      userId: session.userId,
    },
  });

  if (planName && totalClasses > 0) {
    await prisma.plan.create({
      data: { name: planName, totalClasses, studentId: student.id },
    });
  }

  revalidatePath("/alunos");
  redirect(`/alunos/${student.id}`);
}

export async function updateStudentAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const goal = formData.get("goal") as string;

  await prisma.student.update({
    where: { id, userId: session.userId },
    data: { name, phone: phone || null, email: email || null, goal: goal || null },
  });

  revalidatePath(`/alunos/${id}`);
  revalidatePath("/alunos");
  return { success: true };
}

export async function deleteStudentAction(id: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  await prisma.student.delete({ where: { id, userId: session.userId } });
  revalidatePath("/alunos");
  redirect("/alunos");
}

export async function createPlanAction(studentId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const name = formData.get("name") as string;
  const totalClasses = parseInt(formData.get("totalClasses") as string, 10);

  if (!name || !totalClasses) return { error: "Preencha todos os campos." };

  await prisma.plan.create({ data: { name, totalClasses, studentId } });
  revalidatePath(`/alunos/${studentId}`);
  return { success: true };
}
