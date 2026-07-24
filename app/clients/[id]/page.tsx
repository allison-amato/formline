import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Shell from "@/components/Shell";
import PlanBuilder from "@/components/PlanBuilder";
import type { DraftDay } from "@/lib/constants";

export default async function ClientBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [allWeekRecords, library] = await Promise.all([
    prisma.planWeek.findMany({ where: { clientId: id }, orderBy: { week: "asc" } }),
    prisma.exercise.findMany(),
  ]);

  const allWeeks: Record<number, DraftDay[]> = {};
  for (const record of allWeekRecords) {
    allWeeks[record.week] = JSON.parse(record.days);
  }

  const initialDraft: DraftDay[] | null = allWeeks[client.week] ?? null;
  const hasPreviousWeek = client.week > 1 && !!allWeeks[client.week - 1];

  return (
    <Shell>
      <PlanBuilder
        key={client.week}
        client={{
          id: client.id,
          name: client.name,
          goal: client.goal,
          target: client.target,
          week: client.week,
          status: client.status,
          likedIds: JSON.parse(client.likedIds),
          planSentAt: client.planSentAt,
        }}
        initialDraft={initialDraft}
        hasPreviousWeek={hasPreviousWeek}
        allWeeks={allWeeks}
        library={library}
      />
    </Shell>
  );
}
