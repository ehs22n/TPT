// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;



fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_srt_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


#[tauri::command]
fn get_srt_files(path: String) -> Vec<String> {
    let mut results = Vec::new();

    let dir = match fs::read_dir(&path) {
        Ok(d) => d,
        Err(_) => return results,
    };

    for entry in dir {
        if let Ok(entry) = entry {
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "srt" {
                        if let Some(p) = path.to_str() {
                            results.push(p.to_string());
                        }
                    }
                }
            }
        }
    }

    results
}