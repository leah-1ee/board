import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validatePublication } from "./validate.mjs";

const publicationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function createPublication(context, markdown) {
  const root = await mkdtemp(path.join(os.tmpdir(), "nodejs-publication-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "resources"), { recursive: true });
  await mkdir(path.join(root, "profiles"));
  await mkdir(path.join(root, "contributions"));
  await writeFile(
    path.join(root, "resources", "navigation.yaml"),
    "groups:\n  - title: 시작\n    items:\n      - guide\n",
  );
  await writeFile(path.join(root, "resources", "guide.md"), markdown);
  return root;
}

test("validates the repository content", async () => {
  await validatePublication(publicationRoot);
});

test("allows a navigation title override", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "resources", "navigation.yaml"),
    "groups:\n  - title: 시작\n    items:\n      - file: ./guide.md\n        title: Guide shortcut\n",
  );

  await validatePublication(root);
});

test("rejects a relative file link", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n\n[slides](./slides.pdf)\n",
  );

  await assert.rejects(validatePublication(root), /상대 파일 링크/);
});

test("allows a query-relative link to an existing resource", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n\n[guide](?view=resources&resource=guide)\n",
  );

  await validatePublication(root);
});

test("rejects a query-relative link to a missing resource", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n\n[missing](?view=resources&resource=missing)\n",
  );

  await assert.rejects(validatePublication(root), /내부 resource를 찾을 수 없습니다: missing/);
});

test("requires at least one canonical author for a resource", async (context) => {
  const root = await createPublication(context, "# Guide\n\nShort description.\n");

  await assert.rejects(validatePublication(root), /authors/);
});

test("validates contribution notes by Pull Request number", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "contributions", "12345.md"),
    "---\npr-url: https://github.com/nodejs/node/pull/12345\n---\n## Problem\n\nWhat I learned.\n",
  );

  await validatePublication(root);
});

test("allows an optional source URL for a contribution note", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "contributions", "12345.md"),
    "---\npr-url: https://github.com/nodejs/node/pull/12345\nurl: https://example.com/contribution\n---\n## Problem\n\nWhat I learned.\n",
  );

  await validatePublication(root);
});

test("rejects an unsafe source URL for a contribution note", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "contributions", "12345.md"),
    "---\npr-url: https://github.com/nodejs/node/pull/12345\nurl: javascript:alert(1)\n---\n## Problem\n\nWhat I learned.\n",
  );

  await assert.rejects(validatePublication(root), /url은 http 또는 https/);
});

test("requires pr-url metadata for a contribution note", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "contributions", "12345.md"),
    "## Problem\n\nWhat I learned.\n",
  );

  await assert.rejects(validatePublication(root), /pr-url frontmatter가 필요합니다/);
});

test("rejects a contribution note without a Pull Request number", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "contributions", "stream-fix.md"),
    "---\nauthors: [github-id]\n---\n# Contribution note\n",
  );

  await assert.rejects(validatePublication(root), /PR 번호/);
});

test("rejects nested resource directories", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await mkdir(path.join(root, "resources", "nested"));

  await assert.rejects(validatePublication(root), /flat Markdown/);
});

test("rejects unsafe link schemes", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n\n[unsafe](javascript:alert(1))\n",
  );

  await assert.rejects(validatePublication(root), /scheme/);
});

test("warns when a resource is not listed in navigation", async (context) => {
  const root = await createPublication(
    context,
    "---\nauthors: [github-id]\n---\n# Guide\n\nShort description.\n",
  );
  await writeFile(
    path.join(root, "resources", "hidden-guide.md"),
    "---\nauthors: [github-id]\n---\n# Hidden guide\n\nShort description.\n",
  );
  const warn = context.mock.method(console, "warn", () => {});

  await validatePublication(root);

  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /navigation에 없는 resource.*hidden-guide/);
});
