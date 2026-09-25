import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

export type StoredCatalogEdit = {
  id: string;
  status: "upserted" | "deleted";
  record: Record<string, unknown> | null;
  updatedAt: string;
  updatedBy: string;
};

type CatalogSnapshot = {
  version: 1;
  edits: StoredCatalogEdit[];
  updatedAt: string | null;
};

const BLOB_PATH = "catalog/catalog-edits.json";
const EMPTY_SNAPSHOT: CatalogSnapshot = { version: 1, edits: [], updatedAt: null };

export function catalogStorageConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
      || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
      || process.env.VERCEL === "1",
  );
}

async function readSnapshot(): Promise<{ snapshot: CatalogSnapshot; etag: string | null }> {
  if (!catalogStorageConfigured()) return { snapshot: EMPTY_SNAPSHOT, etag: null };

  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result) return { snapshot: EMPTY_SNAPSHOT, etag: null };
  if (result.statusCode !== 200 || !result.stream) throw new Error("Não foi possível ler as alterações do catálogo.");

  const raw = await new Response(result.stream).text();
  const parsed = JSON.parse(raw) as Partial<CatalogSnapshot>;
  if (parsed.version !== 1 || !Array.isArray(parsed.edits)) {
    throw new Error("O arquivo de alterações do catálogo é inválido.");
  }
  return {
    snapshot: {
      version: 1,
      edits: parsed.edits,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    },
    etag: result.blob.etag,
  };
}

export async function readCatalogEdits() {
  return (await readSnapshot()).snapshot.edits;
}

export async function writeCatalogEdit(edit: StoredCatalogEdit) {
  if (!catalogStorageConfigured()) throw new Error("Armazenamento Vercel Blob ainda não configurado.");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await readSnapshot();
    const edits = new Map(current.snapshot.edits.map((item) => [item.id, item]));
    edits.set(edit.id, edit);
    const next: CatalogSnapshot = {
      version: 1,
      edits: [...edits.values()].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt) || left.id.localeCompare(right.id)),
      updatedAt: edit.updatedAt,
    };

    try {
      await put(BLOB_PATH, JSON.stringify(next), {
        access: "private",
        contentType: "application/json; charset=utf-8",
        cacheControlMaxAge: 60,
        ...(current.etag ? { ifMatch: current.etag } : { allowOverwrite: false }),
      });
      return;
    } catch (error) {
      const conflict = error instanceof BlobPreconditionFailedError
        || /already exists|precondition|etag/i.test(error instanceof Error ? error.message : "");
      if (!conflict || attempt === 3) throw error;
    }
  }
}
