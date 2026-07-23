import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Shell from "@/components/Shell";
import GoalForm from "@/components/GoalForm";

export default async function ClientGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <Shell>
      <GoalForm
        clientId={client.id}
        clientName={client.name}
        initialGoal={client.goal}
        initialTarget={client.target}
      />
    </Shell>
  );
}
