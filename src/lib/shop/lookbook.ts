import { prisma } from "@/lib/db";

export type Look = {
  id: string;
  title: string;
  note: string | null;
  imageUrl: string;
  alt: string;
  productSlugs: string[];
  published: boolean;
  sortOrder: number;
};

/** Stored as a JSON string; a malformed row must not take the page down. */
function slugsOf(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

const toLook = (row: {
  id: string; title: string; note: string | null; imageUrl: string;
  alt: string; productSlugs: string; published: boolean; sortOrder: number;
}): Look => ({ ...row, productSlugs: slugsOf(row.productSlugs) });

/** Published looks, in the order they were arranged. */
export async function listLooks(): Promise<Look[]> {
  const rows = await prisma.lookbookLook.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toLook);
}

/** Everything, including drafts, for the console. */
export async function listAllLooks(): Promise<Look[]> {
  const rows = await prisma.lookbookLook.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toLook);
}
