use std::fs;
use std::path::PathBuf;
use once_cell::sync::OnceCell;

static APP_FOLDER_PATH: OnceCell<PathBuf> = OnceCell::new();

// Initialise a folder in Appdata
#[tauri::command]
fn init_app_folder() -> Result<String, String> {
    if let Some(appdata_path) = dirs::data_dir() {
        let folder_path: PathBuf = appdata_path.join("thao_management");
        match fs::create_dir_all(&folder_path) {
            Ok(_) => {
                APP_FOLDER_PATH.set(folder_path.clone()).ok();
                Ok(format!("Created folder at: {}", folder_path.display()))
            },
            Err(e) => Err(format!("Failed to create folder: {}", e)),
        }
    } else {
        Err("Could not locate AppData directory.".to_string())
    }
}

// Check if the directory is empty
#[tauri::command]
fn is_directory_empty() -> Result<bool, String> {
    match APP_FOLDER_PATH.get() {
        Some(path) => match fs::read_dir(path) {
            Ok(mut entries) => Ok(entries.next().is_none()),
            Err(err) => Err(format!("Failed to read directory: {}", err)),
        },
        None => Err("App folder is not initialized.".to_string())
    }
}

// Allow the frontend to access the path to data
#[tauri::command]
fn get_app_folder_path_str() -> Result<String, String> {
    match APP_FOLDER_PATH.get() {
        Some(path) => Ok(path.display().to_string()),
        None => Err("App folder is not initialized.".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![init_app_folder, is_directory_empty, get_app_folder_path_str])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
