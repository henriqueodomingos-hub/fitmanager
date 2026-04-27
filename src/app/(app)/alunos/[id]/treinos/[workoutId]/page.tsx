import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2, Dumbbell, Image as ImageIcon, Video } from "lucide-react";
import { AddExerciseDialog } from "./AddExerciseDialog";
import { DeleteWorkoutButton } from "./DeleteWorkoutButton";
import { DeleteExerciseButton } from "./DeleteExerciseButton";
import { MediaUploader } from "./MediaUploader";
import { DeleteMediaButton } from "./DeleteMediaButton";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string; workoutId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      student: true,
      exercises: {
        orderBy: { order: "asc" },
        include: { media: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!workout || workout.student.userId !== session.userId) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/alunos/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para {workout.student.name}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
            {workout.description && (
              <p className="text-gray-500 mt-1 text-sm">{workout.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{workout.exercises.length} exercício(s)</Badge>
            <DeleteWorkoutButton workoutId={workoutId} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <AddExerciseDialog workoutId={workoutId} />
      </div>

      {workout.exercises.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum exercício adicionado</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Adicionar Exercício" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workout.exercises.map((exercise, index) => (
            <Card key={exercise.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <CardTitle className="text-base">{exercise.name}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {exercise.sets && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {exercise.sets} séries
                          </span>
                        )}
                        {exercise.reps && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {exercise.reps} reps
                          </span>
                        )}
                        {exercise.weight && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {exercise.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DeleteExerciseButton exerciseId={exercise.id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {exercise.tip && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Dica de execução</p>
                    <p className="text-sm text-amber-800">{exercise.tip}</p>
                  </div>
                )}

                {exercise.media.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mídia demonstrativa</p>
                    <div className="grid grid-cols-3 gap-2">
                      {exercise.media.map((m) => (
                        <div key={m.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-video">
                          {m.type === "VIDEO" ? (
                            <video src={m.url} className="w-full h-full object-cover" controls />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.url} alt="Demonstração" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteMediaButton mediaId={m.id} />
                          </div>
                          <div className="absolute bottom-1 left-1">
                            {m.type === "VIDEO" ? (
                              <Video className="w-3 h-3 text-white drop-shadow" />
                            ) : (
                              <ImageIcon className="w-3 h-3 text-white drop-shadow" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <MediaUploader exerciseId={exercise.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
