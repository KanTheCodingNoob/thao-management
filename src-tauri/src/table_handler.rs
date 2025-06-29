use serde::{Deserialize, Serialize};
use serde_json::Value;
use rusqlite::{params, Connection, Result};
use crate::{DATABASE_PATH};
use tokio::task;

#[derive(Serialize, Deserialize, Debug)]
struct Table {
    id: String,
    name: String,
    price: u64,
    inventory: u32
}

#[tauri::command]
pub async fn create_table(table_name: String, rows: Vec<Value>) -> Result<(), String> {
    // Validate table name: only allow alphanumeric and underscores
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err("Tên bảng không phù hợp".into());
    }

    task::spawn_blocking(move || {
        let conn = Connection::open(DATABASE_PATH.get().unwrap())
            .map_err(|e| "Mở bảng thất bại")?;

        // Dynamically build query string
        let create_table_sql = format!(
            "CREATE TABLE IF NOT EXISTS {} (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price NUMBER NOT NULL,
                inventory NUMBER
            )",
            table_name
        );

        // Execute table creation
        conn.execute(&create_table_sql, [])
            .map_err(|e| "Tạo bảng thất bại")?;

        let insert_sql = format!(
            "INSERT OR IGNORE INTO {} (id, name, price, inventory)\
             VALUES (?1, ?2, ?3, ?4)",
            table_name
        );

        // Insert every object in JSON to the database as rows
        for value in rows{
            let row: Table = serde_json::from_value(value)
                .map_err(|e| "Dữ liệu không phù hợp")?;

            conn.execute(&insert_sql, params![row.id, row.name, row.price, row.inventory])
                .map_err(|e| "Nhập dữ liệu thất bại")?;
        }

        Ok(())
    }).await.map_err(|e| "Sự cố đã xảy ra")?
}

#[tauri::command]
pub fn get_table_name() -> Result<Vec<String>, String> {
    let conn = Connection::open(DATABASE_PATH.get().unwrap())
        .map_err(|e| format!("Failed to create/open table: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_schema WHERE type='table'", )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let table_iter = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| format!("Failed to query tables: {}", e))?;

    let mut tables = Vec::new();

    for table in table_iter {
        let name: String = table.map_err(|e| format!("Failed to get row: {}", e))?;
        tables.push(name);
    }
    Ok(tables)
}