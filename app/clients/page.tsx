import prisma from "@/lib/prisma";
import Shell from "@/components/Shell";
import ClientsPageContent from "@/components/ClientsPageContent";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const rows = clients.map((c) => ({
    id: c.id,
    name: c.name,
    goal: c.goal,
    week: c.week,
    status: c.status,
  }));

  return (
    <Shell>
      <ClientsPageContent clients={rows} />
    </Shell>
  );
}
