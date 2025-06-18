use std::fs;
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            if let Some(appdata_path) = dirs::data_dir() {
                let folder_path: PathBuf = appdata_path.join("thao_management");
                match fs::create_dir_all(&folder_path) {
                    Ok(_) => println!("Created folder at: {}", folder_path.display()),
                    Err(e) => eprintln!("Failed to create folder: {}", e),
                }
            } else {
                eprintln!("Could not locate AppData.");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
