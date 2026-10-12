import assert from "node:assert/strict";
import { after, beforeEach, mock, test } from "node:test";

// All storage calls are mocked: this suite never contacts or changes a Blob store.
class BlobNotFoundError extends Error {}
class BlobPreconditionFailedError extends Error {}
let snapshot;
let revision;
let writes;
let headCalls;
let duringRead;
let duringWrite;

const edit = (id) => ({
  id, status: "upserted", record: { id, artist: "Test", title: id, market: [], tags: [] },
  updatedAt: "2026-10-11T12:00:00.000Z", updatedBy: "test",
});

mock.module("@vercel/blob", { namedExports: {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  head: async () => {
    headCalls += 1;
    if (!snapshot) throw new BlobNotFoundError();
    return { etag: `"storage-${revision}"` };
  },
  get: async (_path, options) => {
    assert.equal(options.useCache, false);
    assert.equal(options.headers["Accept-Encoding"], "identity");
    if (!snapshot) return null;
    const data = JSON.stringify(snapshot);
    if (duringRead) { const action = duringRead; duringRead = null; action(); }
    return { statusCode: 200, stream: new Response(data).body, blob: { etag: 'W/"delivery-etag"' } };
  },
  put: async (_path, body, options) => {
    writes.push({ body: JSON.parse(body), options });
    if (duringWrite) { const action = duringWrite; duringWrite = null; action(); }
    if (snapshot) {
      assert.equal(options.allowOverwrite, true);
      if (options.ifMatch !== `"storage-${revision}"`) throw new BlobPreconditionFailedError();
    } else {
      assert.equal(options.allowOverwrite, false);
      assert.equal(options.ifMatch, undefined);
    }
    snapshot = JSON.parse(body);
    revision += 1;
  },
} });

const previousVercel = process.env.VERCEL;
process.env.VERCEL = "1";
after(() => { if (previousVercel == null) delete process.env.VERCEL; else process.env.VERCEL = previousVercel; });
const { readCatalogEdits, writeCatalogEdit } = await import("../lib/catalog-store.ts");

beforeEach(() => {
  snapshot = { version: 1, edits: [edit("existing")], updatedAt: null };
  revision = 1;
  writes = [];
  headCalls = 0;
  duringRead = null;
  duringWrite = null;
});

test("updates an existing snapshot using the storage ETag, not the HTTP delivery ETag", async () => {
  await writeCatalogEdit(edit("new"));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].options.ifMatch, '"storage-1"');
  assert.deepEqual(snapshot.edits.map((item) => item.id), ["existing", "new"]);
});

test("re-reads when the snapshot changes during the download and keeps the concurrent edit", async () => {
  duringRead = () => { snapshot.edits.push(edit("other")); revision += 1; };
  await writeCatalogEdit(edit("new"));
  assert.equal(headCalls, 4);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].options.ifMatch, '"storage-2"');
  assert.deepEqual(snapshot.edits.map((item) => item.id), ["existing", "new", "other"]);
});

test("retries a genuine write conflict without dropping the winning editor's record", async () => {
  duringWrite = () => { snapshot.edits.push(edit("other")); revision += 1; };
  await writeCatalogEdit(edit("new"));
  assert.equal(writes.length, 2);
  assert.equal(writes[1].options.ifMatch, '"storage-2"');
  assert.deepEqual(snapshot.edits.map((item) => item.id), ["existing", "new", "other"]);
});

test("creates a missing snapshot without enabling unconditional overwrite", async () => {
  snapshot = null;
  await writeCatalogEdit(edit("new"));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].options.allowOverwrite, false);
  assert.deepEqual(snapshot.edits.map((item) => item.id), ["new"]);
});

test("ordinary reads do not need extra metadata requests", async () => {
  assert.deepEqual(await readCatalogEdits(), [edit("existing")]);
  assert.equal(headCalls, 0);
});
