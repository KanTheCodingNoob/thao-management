use serde::{Deserialize, Serialize};
use serde_json::Value;
use rusqlite::{params, Connection, Result};
use crate::{DATABASE_PATH};

#[derive(Serialize, Deserialize, Debug)]
struct Table {
    id: String,
    name: String,
    price: u64,
    inventory: u32
}

#[tauri::command]
pub fn create_table(table_name: String, rows: Vec<Value>) -> Result<(), String> {
    // Validate table name: only allow alphanumeric and underscores
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err("Invalid table name".into());
    }

    let conn = Connection::open(DATABASE_PATH.get().unwrap())
        .map_err(|e| format!("Failed to open DB: {}", e))?;

    // Dynamically build query string
    let create_table_sql = format!(
        "CREATE TABLE {} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price NUMBER NOT NULL,
            inventory NUMBER
        )",
        table_name
    );

    // Execute table creation
    conn.execute(&create_table_sql, [])
        .map_err(|e| format!("Failed to create table: {}", e))?;

    let insert_sql = format!(
        "INSERT INTO {} (id, name, price, inventory)\
         VALUES (?1, ?2, ?3, ?4)",
        table_name
    );

    // Insert every element in JSON
    for value in rows{
        let row: Table = serde_json::from_value(value)
            .map_err(|e| format!("Invalid row data: {}", e))?;

        conn.execute(&insert_sql, params![row.id, row.name, row.price, row.inventory])
            .map_err(|e| format!("Insert failed: {}", e))?;
    }

    Ok(())
}