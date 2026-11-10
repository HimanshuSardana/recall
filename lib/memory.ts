import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Role = "user" | "assistant";
export type StoredTurn = { at: number; role: Role; text: string };

const DIR = join(process.cwd(), "data");
const FILE = join(DIR, "memory.db");
const OWNER_LIMIT = 2000;
const DAY = 24 * 60 * 60 * 1000;

let database: DatabaseSync | null = null;

function db() {
  if (database) return database;

  mkdirSync(DIR, { recursive: true });
  database = new DatabaseSync(FILE);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS turns (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      chat TEXT NOT NULL,
      at INTEGER NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS turns_owner_at ON turns(owner, at DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS turns_fts
      USING fts5(text, turn_id UNINDEXED, tokenize = 'porter');
  `);

  return database;
}

export function rememberTurn(turn: {
  owner: string;
  chat: string;
  role: Role;
  text: string;
  at?: number;
}) {
  const text = turn.text.trim();
  if (!text) return;

  const at = turn.at ?? Date.now();
  const handle = db();

  // A retried request must not become a second memory of the same sentence.
  const last = handle
    .prepare("SELECT role, text FROM turns WHERE owner = ? AND chat = ? ORDER BY at DESC LIMIT 1")
    .get(turn.owner, turn.chat) as { role?: string; text?: string } | undefined;

  if (last?.role === turn.role && last.text === text) return;

  const id = crypto.randomUUID();
  handle
    .prepare("INSERT INTO turns (id, owner, chat, at, role, text) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, turn.owner, turn.chat, at, turn.role, text);
  handle.prepare("INSERT INTO turns_fts (text, turn_id) VALUES (?, ?)").run(text, id);

  handle
    .prepare(
      `DELETE FROM turns WHERE owner = ? AND id NOT IN (
         SELECT id FROM turns WHERE owner = ? ORDER BY at DESC LIMIT ${OWNER_LIMIT}
       )`,
    )
    .run(turn.owner, turn.owner);
}

export function recentAsks(owner: string, limit = 5): StoredTurn[] {
  const rows = db()
    .prepare(
      "SELECT at, text FROM turns WHERE owner = ? AND role = 'user' ORDER BY at DESC LIMIT ?",
    )
    .all(owner, limit) as { at: number; text: string }[];

  return rows.reverse().map((row) => ({ at: row.at, role: "user" as const, text: row.text }));
}

function ftsQuery(query: string) {
  return query
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term}"`)
    .join(" OR ");
}

export function recallTurns(options: {
  owner: string;
  query?: string;
  from?: string;
  to?: string;
  limit?: number;
}): StoredTurn[] {
  const { owner, query, from, to, limit = 8 } = options;

  const clauses: string[] = ["t.owner = ?"];
  const params: (string | number)[] = [owner];

  if (from) {
    clauses.push("t.at >= ?");
    params.push(Date.parse(`${from}T00:00:00Z`));
  }

  if (to) {
    clauses.push("t.at < ?");
    params.push(Date.parse(`${to}T00:00:00Z`) + DAY);
  }

  const terms = query ? ftsQuery(query) : "";

  const rows = terms
    ? (db()
        .prepare(
          `SELECT t.at, t.role, t.text
             FROM turns_fts f
             JOIN turns t ON t.id = f.turn_id
            WHERE turns_fts MATCH ? AND ${clauses.join(" AND ")}
            ORDER BY t.at DESC
            LIMIT ?`,
        )
        .all(terms, ...params, limit) as { at: number; role: Role; text: string }[])
    : (db()
        .prepare(
          `SELECT t.at, t.role, t.text
             FROM turns t
            WHERE ${clauses.join(" AND ")}
            ORDER BY t.at DESC
            LIMIT ?`,
        )
        .all(...params, limit) as { at: number; role: Role; text: string }[]);

  return rows.reverse().map((row) => ({
    at: row.at,
    role: row.role,
    text: row.text.slice(0, 600),
  }));
}
