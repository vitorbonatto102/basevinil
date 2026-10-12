import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from "@vercel/blob";

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

export class CatalogWriteConflictError extends Error {
  constructor() {
    super("O catálogo está recebendo outra gravação ao mesmo tempo. Seus dados não foram descartados; tente salvar novamente em alguns segundos.");
    this.name = "CatalogWriteConflictError";
  }
}

class SnapshotChangedError extends Error {}

export function catalogStorageConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
      || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
      || process.env.VERCEL === "1",
  );
}

async function readSnapshot(forWrite = false): Promise<{ snapshot: CatalogSnapshot; etag: string | null }> {
  if (!catalogStorageConfigured()) return { snapshot: EMPTY_SNAPSHOT, etag: null };

  // Use the storage API's ETag for writes, rather than the download response's
  // representation-specific ETag (which can differ after HTTP compression).
  let metadata = null;
  if (forWrite) {
    try {
      metadata = await head(BLOB_PATH);
    } catch (error) {
      if (error instanceof BlobNotFoundError) return { snapshot: EMPTY_SNAPSHOT, etag: null };
      throw error;
    }
    if (!metadata.etag) throw new Error("Não foi possível verificar a versão do catálogo para salvar.");
  }

  const result = await get(BLOB_PATH, {
    access: "private",
    useCache: false,
    headers: { "Accept-Encoding": "identity" },
  });
  if (!result) {
    if (metadata) throw new SnapshotChangedError();
    return { snapshot: EMPTY_SNAPSHOT, etag: null };
  }
  if (result.statusCode !== 200 || !result.stream) throw new Error("Não foi possível ler as alterações do catálogo.");

  const raw = await new Response(result.stream).text();
  const parsed = JSON.parse(raw) as Partial<CatalogSnapshot>;
  if (parsed.version !== 1 || !Array.isArray(parsed.edits)) {
    throw new Error("O arquivo de alterações do catálogo é inválido.");
  }
  if (metadata) {
    // Do not combine an older snapshot with a newer write token: that would
    // allow a concurrent edit to be overwritten even when ifMatch succeeds.
    const latestMetadata = await head(BLOB_PATH);
    if (metadata.etag !== latestMetadata.etag) throw new SnapshotChangedError();
  }
  return {
    snapshot: {
      version: 1,
      edits: parsed.edits,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    },
    etag: metadata?.etag ?? result.blob.etag,
  };
}

export async function readCatalogEdits() {
  return (await readSnapshot()).snapshot.edits;
}

export async function writeCatalogEdit(edit: StoredCatalogEdit) {
  if (!catalogStorageConfigured()) throw new Error("Armazenamento Vercel Blob ainda não configurado.");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const current = await readSnapshot(true);
      const edits = new Map(current.snapshot.edits.map((item) => [item.id, item]));
      edits.set(edit.id, edit);
      const next: CatalogSnapshot = {
        version: 1,
        edits: [...edits.values()].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt) || left.id.localeCompare(right.id)),
        updatedAt: edit.updatedAt,
      };

      await put(BLOB_PATH, JSON.stringify(next), {
        access: "private",
        contentType: "application/json; charset=utf-8",
        cacheControlMaxAge: 60,
        ...(current.etag ? { allowOverwrite: true, ifMatch: current.etag } : { allowOverwrite: false }),
      });
      return;
    } catch (error) {
      const conflict = error instanceof SnapshotChangedError || error instanceof BlobPreconditionFailedError
        || /already exists|precondition|etag/i.test(error instanceof Error ? error.message : "");
      if (!conflict) throw error;
      if (attempt === 7) throw new CatalogWriteConflictError();

      // Concurrent editors can invalidate the ETag between read and write.
      // Back off so the next read has a chance to observe the winning write.
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1) + Math.random() * 60));
    }
  }
}
