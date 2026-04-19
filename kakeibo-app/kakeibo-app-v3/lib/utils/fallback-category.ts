import { prisma } from "@/lib/prisma";

export async function ensureFallbackCategory(userId: string): Promise<string> {
  const fallback = await prisma.category.findFirst({
    where: { userId, name: "その他", isDefault: true },
    select: { id: true },
  });
  if (fallback) return fallback.id;

  const any = await prisma.category.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (any) return any.id;

  const created = await prisma.category.create({
    data: {
      userId,
      name: "その他",
      color: "#7C8A96",
      sortOrder: 999,
      isDefault: true,
    },
    select: { id: true },
  });
  return created.id;
}
