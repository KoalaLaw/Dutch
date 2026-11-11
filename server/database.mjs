import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function openDatabase(path) {
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true,mode:0o700})
  const db=new DatabaseSync(path,{timeout:5000})
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS progress(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,revision INTEGER NOT NULL,snapshot TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS progress_history(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,revision INTEGER NOT NULL,snapshot TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,revision));`)
  return db
}

export function readProgress(db,userId) {
  const row=db.prepare('SELECT revision,snapshot,updated_at FROM progress WHERE user_id=?').get(userId)
  return row?{revision:row.revision,snapshot:JSON.parse(row.snapshot),updatedAt:row.updated_at}:{revision:0,snapshot:null,updatedAt:null}
}

export function writeProgress(db,userId,expectedRevision,snapshot) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const previous=readProgress(db,userId)
    if(previous.revision!==expectedRevision){db.exec('ROLLBACK');return {conflict:true,...previous}}
    const revision=expectedRevision+1,updatedAt=new Date().toISOString(),raw=JSON.stringify(snapshot)
    if(previous.snapshot)db.prepare('INSERT OR IGNORE INTO progress_history(user_id,revision,snapshot,updated_at) VALUES(?,?,?,?)').run(userId,previous.revision,JSON.stringify(previous.snapshot),previous.updatedAt)
    db.prepare('INSERT INTO progress(user_id,revision,snapshot,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,snapshot=excluded.snapshot,updated_at=excluded.updated_at').run(userId,revision,raw,updatedAt)
    db.prepare('DELETE FROM progress_history WHERE user_id=? AND revision<?').run(userId,Math.max(0,revision-5))
    db.exec('COMMIT')
    return {revision,updatedAt}
  } catch(error){db.exec('ROLLBACK');throw error}
}
