import { catalogStorageConfigured, readCatalogEdits, writeCatalogEdit } from "../../../lib/catalog-store";
import { hasSitePasswordSession } from "../../../lib/site-password";

export const dynamic = "force-dynamic";

type CatalogEditStatus = "upserted" | "deleted";

async function editorSession(request: Request) {
  const password = process.env.SITE_PASSWORD;
  const signedIn = Boolean(password && await hasSitePasswordSession(request, password));
  const canEdit = signedIn && catalogStorageConfigured();
  return {
    signedIn,
    canEdit,
    email: canEdit ? "senha compartilhada" : null,
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
  return JSON.parse(serialized) as Record<string, unknown>;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado.";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const edits = await readCatalogEdits();
    return Response.json(
      { edits, editor: await editorSession(request) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await editorSession(request);
    if (!session.signedIn) return Response.json({ error: "Entre com a senha para editar." }, { status: 401 });
    if (!session.canEdit) return Response.json({ error: "O armazenamento online ainda não está configurado." }, { status: 503 });

    const body = await request.json() as { id?: unknown; status?: unknown; record?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = body.status as CatalogEditStatus;
    if (!id || id.length > 200) return Response.json({ error: "ID inválido." }, { status: 400 });
    if (status !== "upserted" && status !== "deleted") {
      return Response.json({ error: "Operação inválida." }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    await writeCatalogEdit({
      id,
      status,
      record: status === "deleted" ? null : safeRecord(body.record, id),
      updatedAt,
      updatedBy: "shared-password",
    });

    return Response.json({ ok: true, id, status, updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    const status = /inválid|grande demais/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
