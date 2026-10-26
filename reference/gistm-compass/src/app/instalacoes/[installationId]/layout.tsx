import type { Metadata } from "next";
import { getInstallationContext } from "@/lib/context";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ installationId: string }>;
}): Promise<Metadata> {
  const { installationId } = await params;
  const { installation } = await getInstallationContext(installationId);
  return {
    title: `${installation.name} — GISTM Compass`,
  };
}

export default async function InstallationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ installationId: string }>;
}) {
  const { installationId } = await params;
  const { installation } = await getInstallationContext(installationId);
  const session = await auth();

  // Alimenta o seletor de instalação do menu. Escopado à organização da
  // sessão — o mesmo limite que `getInstallationContext` já aplica.
  const installations = await prisma.installation.findMany({
    where: { organizationId: session!.user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 min-w-0">
      <Sidebar
        installationId={installation.id}
        installationName={installation.name}
        userName={session!.user.name ?? session!.user.email ?? ""}
        installations={installations}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
