mod table_handler;

use std::fs;
use std::path::PathBuf;
use once_cell::sync::OnceCell;
use rusqlite::Connection;

pub static DATABASE_PATH: OnceCell<PathBuf> = OnceCell::new();

// Initialise a folder in Appdata
#[tauri::command]
fn init_app_folder() -> Result<String, String> {
    let appdata_path = dirs::data_dir().ok_or("Could not locate AppData directory.")?;
    let folder_path = appdata_path.join("thao_management");

    // Create directory
    fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;

    // Initialize database file
    let db_path = folder_path.join("management_data.db");
    Connection::open(&db_path)
        .map_err(|e| format!("Failed to create/open database: {}", e))?;

    // Set database path
    DATABASE_PATH.set(db_path.clone()).ok();

    Ok(format!(
        "Initialized folder at: {} with DB: {}",
        folder_path.display(),
        db_path.display()
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init_app_folder,
            table_handler::create_table,
            table_handler::get_table_name,
            table_handler::get_requested_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
