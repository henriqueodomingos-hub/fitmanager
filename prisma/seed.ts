import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const libsql = createClient({ url: `file:${dbPath}` });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("123456", 10);
  const user = await prisma.user.upsert({
    where: { email: "personal@fitmanager.com" },
    update: {},
    create: { name: "Carlos Silva", email: "personal@fitmanager.com", password },
  });

  const ana = await prisma.student.upsert({
    where: { id: "student-ana" },
    update: {},
    create: {
      id: "student-ana",
      name: "Ana Paula",
      phone: "(11) 98765-4321",
      email: "ana@email.com",
      goal: "Perda de peso e condicionamento físico",
      userId: user.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: "plan-ana" },
    update: {},
    create: {
      id: "plan-ana",
      name: "Plano Mensal",
      totalClasses: 12,
      doneClasses: 10,
      studentId: ana.id,
    },
  });

  const joao = await prisma.student.upsert({
    where: { id: "student-joao" },
    update: {},
    create: {
      id: "student-joao",
      name: "João Ferreira",
      phone: "(11) 91234-5678",
      goal: "Hipertrofia muscular",
      userId: user.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: "plan-joao" },
    update: {},
    create: {
      id: "plan-joao",
      name: "Plano Trimestral",
      totalClasses: 36,
      doneClasses: 18,
      studentId: joao.id,
    },
  });

  const workout = await prisma.workout.upsert({
    where: { id: "workout-joao-a" },
    update: {},
    create: {
      id: "workout-joao-a",
      name: "Treino A — Peito e Tríceps",
      description: "Foco em força e hipertrofia para peitoral e tríceps",
      studentId: joao.id,
    },
  });

  await prisma.exercise.upsert({
    where: { id: "ex-supino" },
    update: {},
    create: {
      id: "ex-supino",
      name: "Supino Reto",
      sets: 4,
      reps: "12",
      weight: "60kg",
      tip: "Mantenha os cotovelos a 45° do tronco. Desça a barra de forma controlada até tocar levemente o peito.",
      order: 0,
      workoutId: workout.id,
    },
  });

  await prisma.exercise.upsert({
    where: { id: "ex-triceps" },
    update: {},
    create: {
      id: "ex-triceps",
      name: "Tríceps Corda",
      sets: 3,
      reps: "15",
      weight: "25kg",
      tip: "No ponto final do movimento, separe as mãos e gire os punhos para fora para máxima contração.",
      order: 1,
      workoutId: workout.id,
    },
  });

  await prisma.class.create({
    data: {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      duration: 60,
      notes: "Aluna bem disposta. Aumentei carga nos agachamentos.",
      status: "DONE",
      studentId: ana.id,
      planId: "plan-ana",
    },
  });

  await prisma.class.create({
    data: {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      duration: 55,
      status: "DONE",
      studentId: joao.id,
      planId: "plan-joao",
    },
  });

  console.log("Seed concluído!");
  console.log("\nConta de acesso:");
  console.log("  Email: personal@fitmanager.com");
  console.log("  Senha: 123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
