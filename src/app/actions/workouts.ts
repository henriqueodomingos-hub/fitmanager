"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function createWorkoutAction(studentId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) return { error: "Nome é obrigatório." };

  const student = await prisma.student.findUnique({
    where: { id: studentId, userId: session.userId },
  });
  if (!student) return { error: "Aluno não encontrado." };

  const workout = await prisma.workout.create({
    data: { name, description: description || null, studentId },
  });

  revalidatePath(`/alunos/${studentId}`);
  redirect(`/alunos/${studentId}/treinos/${workout.id}`);
}

export async function updateWorkoutAction(workoutId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { student: true },
  });
  if (!workout || workout.student.userId !== session.userId) return { error: "Não encontrado." };

  await prisma.workout.update({
    where: { id: workoutId },
    data: { name, description: description || null },
  });

  revalidatePath(`/alunos/${workout.studentId}/treinos/${workoutId}`);
  return { success: true };
}

export async function deleteWorkoutAction(workoutId: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { student: true },
  });
  if (!workout || workout.student.userId !== session.userId) return { error: "Não encontrado." };

  await prisma.workout.delete({ where: { id: workoutId } });
  revalidatePath(`/alunos/${workout.studentId}`);
  redirect(`/alunos/${workout.studentId}`);
}

export async function addExerciseAction(workoutId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { student: true, exercises: true },
  });
  if (!workout || workout.student.userId !== session.userId) return { error: "Não encontrado." };

  const name = formData.get("name") as string;
  const sets = formData.get("sets") as string;
  const reps = formData.get("reps") as string;
  const weight = formData.get("weight") as string;
  const tip = formData.get("tip") as string;

  if (!name) return { error: "Nome do exercício é obrigatório." };

  const order = workout.exercises.length;
  const exercise = await prisma.exercise.create({
    data: {
      name,
      sets: sets ? parseInt(sets, 10) : null,
      reps: reps || null,
      weight: weight || null,
      tip: tip || null,
      order,
      workoutId,
    },
  });

  const mediaFiles = formData.getAll("media") as File[];
  for (const file of mediaFiles) {
    if (!file || file.size === 0) continue;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${exercise.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    const isVideo = file.type.startsWith("video/");
    await prisma.exerciseMedia.create({
      data: { url: `/uploads/${filename}`, type: isVideo ? "VIDEO" : "PHOTO", exerciseId: exercise.id },
    });
  }

  revalidatePath(`/alunos/${workout.studentId}/treinos/${workoutId}`);
  return { success: true };
}

export async function deleteExerciseAction(exerciseId: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { workout: { include: { student: true } } },
  });
  if (!exercise || exercise.workout.student.userId !== session.userId) return { error: "Não encontrado." };

  await prisma.exercise.delete({ where: { id: exerciseId } });
  revalidatePath(`/alunos/${exercise.workout.studentId}/treinos/${exercise.workoutId}`);
  return { success: true };
}

export async function addMediaToExerciseAction(exerciseId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { workout: { include: { student: true } } },
  });
  if (!exercise || exercise.workout.student.userId !== session.userId) return { error: "Não encontrado." };

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "Arquivo inválido." };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${exerciseId}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  const isVideo = file.type.startsWith("video/");

  await prisma.exerciseMedia.create({
    data: { url: `/uploads/${filename}`, type: isVideo ? "VIDEO" : "PHOTO", exerciseId },
  });

  revalidatePath(`/alunos/${exercise.workout.studentId}/treinos/${exercise.workoutId}`);
  return { success: true };
}

export async function deleteMediaAction(mediaId: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const media = await prisma.exerciseMedia.findUnique({
    where: { id: mediaId },
    include: { exercise: { include: { workout: { include: { student: true } } } } },
  });
  if (!media || media.exercise.workout.student.userId !== session.userId) return { error: "Não encontrado." };

  await prisma.exerciseMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/alunos/${media.exercise.workout.studentId}/treinos/${media.exercise.workoutId}`);
  return { success: true };
}
