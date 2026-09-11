import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

type CatalogEditStatus = "upserted" | "deleted";

type RuntimeEnv = {
  DB?: D1Database;
  EDITOR_EMAILS?: string;
};

type CatalogEditRow = {
  record_id: string;
  status: CatalogEditStatus;
  payload: string;
  updated_at: string;
};

const runtimeEnv = env as unknown as RuntimeEnv;
let catalogTablePromise: Promise<D1Database> | null = null;

async function ensureCatalogEditsTable() {
  if (!runtimeEnv.DB) throw new Error("Banco de dados indisponível.");
  if (!catalogTablePromise) {
    const db = runtimeEnv.DB;
    catalogTablePromise = db.prepare(`
      CREATE TABLE IF NOT EXISTS catalog_edits (
        record_id TEXT PRIMARY KEY NOT NULL,
        status TEXT NOT NULL,
        payload TEXT NOT NULL DEFAULT '{}',
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
      .then(() => db)
      .catch((error) => {
        catalogTablePromise = null;
        throw error;
      });
  }
  return catalogTablePromise;
}

function editorEmails() {
  return new Set((runtimeEnv.EDITOR_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}

async function editorSession() {
  const user = await getChatGPTUser();
  const canEdit = Boolean(user && editorEmails().has(user.email.toLowerCase()));
  return {
    user,
    public: {
      signedIn: Boolean(user),
      canEdit,
      email: canEdit ? user?.email ?? null : null,
    },
  };
}

function safeRecord(value: unknown, expectedId: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Registro inválido.");
  }
  const record = value as Record<string, unknown>;
  if (record.id !== expectedId) throw new Error("ID do registro não confere.");
  if (typeof record.artist !== "string" || !record.artist.trim() || record.artist.length > 300) {
    throw new Error("Artista inválido.");
  }
  if (typeof record.title !== "string" || !record.title.trim() || record.title.length > 500) {
    throw new Error("Álbum inválido.");
  }
  if (!Array.isArray(record.market) || record.market.length > 60) {
    throw new Error("Dados de mercado inválidos.");
  }
  if (!Array.isArray(record.tags) || record.tags.length > 30) {
    throw new Error("Etiquetas inválidas.");
  }
  const serialized = JSON.stringify(record);
  if (serialized.length > 100_000) throw new Error("Registro grande demais.");
  return serialized;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado.";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const db = await ensureCatalogEditsTable();
    const result = await db.prepare(`
      SELECT record_id, status, payload, updated_at
      FROM catalog_edits
      ORDER BY updated_at ASC, record_id ASC
    `).all<CatalogEditRow>();
    const session = await editorSession();
    const edits = (result.results ?? []).map((row) => ({
      id: row.record_id,
      status: row.status,
      record: row.status === "deleted" ? null : JSON.parse(row.payload),
      updatedAt: row.updated_at,
    }));
    return Response.json(
      { edits, editor: session.public },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await editorSession();
    if (!session.user) return Response.json({ error: "Entre com o ChatGPT para editar." }, { status: 401 });
    if (!session.public.canEdit) return Response.json({ error: "Esta conta não pode editar o catálogo." }, { status: 403 });

    const body = await request.json() as { id?: unknown; status?: unknown; record?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = body.status as CatalogEditStatus;
    if (!id || id.length > 200) return Response.json({ error: "ID inválido." }, { status: 400 });
    if (status !== "upserted" && status !== "deleted") {
      return Response.json({ error: "Operação inválida." }, { status: 400 });
    }

    const payload = status === "deleted" ? "{}" : safeRecord(body.record, id);
    const db = await ensureCatalogEditsTable();
    await db.prepare(`
      INSERT INTO catalog_edits (record_id, status, payload, updated_by, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(record_id) DO UPDATE SET
        status = excluded.status,
        payload = excluded.payload,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, status, payload, session.user.email).run();

    return Response.json({ ok: true, id, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    const status = /inválid|grande demais/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
