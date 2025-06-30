use serde::{Deserialize, Serialize};
use serde_json::Value;
use rusqlite::{params, Connection, Result};
use crate::{DATABASE_PATH};
use tokio::task;

#[derive(Serialize, Deserialize, Debug)]
pub struct Table {
    pub id: String,
    pub name: String,
    pub price: u32,
    pub inventory: u32,
    pub brand: String
}

#[derive(serde::Serialize, Deserialize, Debug)]
pub struct PaginatedResult {
    pub data: Vec<Table>,
    pub total_pages: u32,
}

#[tauri::command]
pub async fn create_table(table_name: String, rows: Vec<Value>, import: bool) -> Result<(), String> {
    // Validate table name: only allow alphanumeric and underscores
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err("Tên bảng không phù hợp".into());
    }

    task::spawn_blocking(move || {
        let conn = Connection::open(DATABASE_PATH.get().unwrap())
            .map_err(|_e| "Mở bảng thất bại")?;

        // Dynamically build query string
        let create_table_sql = format!(
            "CREATE TABLE IF NOT EXISTS {} (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price NUMBER NOT NULL,
                inventory NUMBER,
                brand TEXT NOT NULL
            )",
            table_name
        );

        // Execute table creation
        conn.execute(&create_table_sql, [])
            .map_err(|_e| "Tạo bảng thất bại")?;

        let insert_sql = if import {
            // If importing, increment inventory on conflict
            format!(
                "INSERT INTO {} (id, name, price, inventory, brand)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 ON CONFLICT(id) DO UPDATE SET
                     inventory = inventory + excluded.inventory",
                table_name
            )
        } else {
            // If not importing, ignore duplicate ID
            format!(
                "INSERT OR IGNORE INTO {} (id, name, price, inventory, brand)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                table_name
            )
        };

        // Insert every object in JSON to the database as rows
        for value in rows{
            let row: Table = serde_json::from_value(value)
                .map_err(|_e| "Dữ liệu không phù hợp")?;

            conn.execute(&insert_sql, params![row.id, row.name, row.price, row.inventory, row.brand])
                .map_err(|e| format!("Nhập dữ liệu thất bại: {}", e))?;
        }

        Ok(())
    }).await.map_err(|_e| "Sự cố đã xảy ra")?
}

#[tauri::command]
pub fn get_table_name() -> Result<Vec<String>, String> {
    let conn = Connection::open(DATABASE_PATH.get().unwrap())
        .map_err(|e| format!("Failed to create/open table: {}", e.to_string()))?;

    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_schema WHERE type='table'", )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let table_iter = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| format!("Failed to query tables: {}", e))?;

    let mut table_names = Vec::new();

    for table in table_iter {
        let name: String = table.map_err(|e| format!("Failed to get row: {}", e))?;
        table_names.push(name);
    }
    Ok(table_names)
}

#[tauri::command]
pub fn get_requested_data(table_name: String, id: String, name: String, page: u32, page_size: u32) -> Result<PaginatedResult, String> {
    let conn = Connection::open(DATABASE_PATH.get().unwrap()).map_err(|e| e.to_string())?;

    // Calculate offset
    let offset = (page - 1) * page_size;
    let mut data = Vec::new();
    let mut total_rows = 0;

    // Retrieve all table that match the given name
    let like_pattern = format!("%{}%", table_name);
    let mut stmt = conn.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE ?1")
        .map_err(|e| e.to_string())?;
    let table_names = stmt.query_map([like_pattern], |row| row.get::<_, String>(0))
        .map_err(|e| format!("Failed to query matching table names: {}", e))?
        .filter_map(Result::ok)
        .collect::<Vec<String>>();

    for table in table_names {
        // Count matching rows
        let count_query = format!(
            "SELECT COUNT(*) FROM {} WHERE id LIKE ?1 AND name LIKE ?2",
            table
        );

        if let Ok(mut stmt) = conn.prepare(&count_query) {
            let count: i64 = stmt
                .query_row(
                    params![format!("%{}%", id), format!("%{}%", name)],
                    |row| row.get(0),
                )
                .unwrap_or(0);
            total_rows += count;
        }

        // Fetch matching rows with pagination
        let data_query = format!(
            "SELECT * FROM {} WHERE id LIKE ?1 AND name LIKE ?2 LIMIT ?3 OFFSET ?4",
            table
        );

        let mut stmt = match conn.prepare(&data_query) {
            Ok(stmt) => stmt,
            Err(_) => continue, // skip if table structure is incompatible or doesn't exist
        };

        let rows = stmt.query_map(
            params![format!("%{}%", id), format!("%{}%", name), page_size, offset],
            |row| {
                Ok(Table {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    price: row.get(2)?,
                    inventory: row.get(3)?,
                    brand: row.get(4)?,
                })
            },
        );

        if let Ok(mapped) = rows {
            for row in mapped.flatten() {
                data.push(row);
            }
        }
    }

    let total_pages = ((total_rows as u32) + page_size - 1) / page_size;

    Ok(PaginatedResult {
        data,
        total_pages,
    })
}

#[tauri::command]
pub fn increment_item_inventory(id: String, table_name: String) -> Result<(), String> {
    let conn = Connection::open(DATABASE_PATH.get().unwrap()).map_err(|e| e.to_string())?;

    // Prepare SQL query
    let query = format!(
        "UPDATE {} SET inventory = inventory + 1 WHERE id = ?1",
        table_name
    );

    // Execute query
    let affected = conn
        .execute(&query, params![id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("No item found with the given ID.".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn decrement_item_inventory(id: String, table_name: String) -> Result<(), String> {
    let conn = Connection::open(DATABASE_PATH.get().unwrap()).map_err(|e| e.to_string())?;

    // Prepare SQL query
    let query = format!(
        "UPDATE {} SET inventory = inventory - 1 WHERE id = ?1",
        table_name
    );

    // Execute query
    let affected = conn
        .execute(&query, params![id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("No item found with the given ID.".to_string());
    }

    Ok(())
}