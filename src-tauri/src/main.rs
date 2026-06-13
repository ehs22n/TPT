#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_srt_to_txt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn convert_srt_to_txt(path: String) -> Result<String, String> {
    let input_path = Path::new(&path);

    if !input_path.exists() {
        return Err("Path does not exist".into());
    }

    let folder_name = input_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let output_path = input_path
        .parent()
        .unwrap_or(input_path)
        .join(format!("{}_TEXT", folder_name));

    if let Err(e) = fs::create_dir_all(&output_path) {
        return Err(format!("Failed to create output folder: {}", e));
    }

    let dir = match fs::read_dir(input_path) {
        Ok(d) => d,
        Err(e) => return Err(format!("Failed to read dir: {}", e)),
    };

    for entry in dir.flatten() {
        let file_path = entry.path();

        if file_path.is_file() {
            if file_path.extension().and_then(|e| e.to_str()) == Some("srt") {
                if let Ok(content) = fs::read_to_string(&file_path) {
                    let cleaned = parse_srt(&content);

                    let file_stem = file_path
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy();

                    let new_file_path = output_path.join(format!("{}.txt", file_stem));

                    let _ = fs::write(new_file_path, cleaned);
                }
            }
        }
    }

    Ok(output_path.to_string_lossy().to_string())
}

fn parse_srt(content: &str) -> String {
    let mut result = String::new();

    for line in content.lines() {
        let line = line.trim();

        if line.parse::<u32>().is_ok() {
            continue;
        }

        if line.contains("-->") {
            continue;
        }

        if line.is_empty() {
            continue;
        }

        result.push_str(line);
        result.push(' ');
    }

    result.trim().to_string()
}