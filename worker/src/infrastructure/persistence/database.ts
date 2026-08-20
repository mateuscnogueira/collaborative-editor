import sqlite3 from "sqlite3";
import path from "path";

sqlite3.verbose();

const databasePath = path.resolve(
  __dirname,
  "../../../database.sqlite"
);

export const database = new sqlite3.Database(
  databasePath,
  (error) => {

    if (error) {
      console.error("Erro ao conectar ao SQLite:", error);
      return;
    }

    console.log("✅ SQLite conectado.");

    createTables();
  }
);

function createTables(): void {

  database.run(

    `
    CREATE TABLE IF NOT EXISTS document_versions (

      id TEXT PRIMARY KEY,

      document_id TEXT NOT NULL,

      content TEXT NOT NULL,

      user_id TEXT NOT NULL,

      cursor_position INTEGER NOT NULL,

      created_at TEXT NOT NULL

    )
    `,

    (error) => {

      if (error) {
        console.error(
          "Erro ao criar tabela document_versions:",
          error
        );
        return;
      }

      console.log(
        "✅ Tabela document_versions pronta."
      );
    }
  );
}