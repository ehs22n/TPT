#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            convert_srt_to_txt,
            open_output_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn convert_srt_to_txt(path: String) -> Result<String, String> {
    let input_path = Path::new(&path);

    if !input_path.exists() {
        return Err("این پوشه وجود ندارد.".into());
    }

    if !input_path.is_dir() {
        return Err("مسیر انتخاب‌شده پوشه نیست.".into());
    }

    let folder_name = input_path
        .file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new("output"))
        .to_string_lossy();

    let output_path = input_path.join(format!("{}_TEXT", folder_name));

    if let Err(e) = fs::create_dir_all(&output_path) {
        return Err(format!("خطا در ساخت پوشه خروجی: {}", e));
    }

    let dir = match fs::read_dir(input_path) {
        Ok(d) => d,
        Err(e) => return Err(format!("خطا در خواندن پوشه: {}", e)),
    };

    let mut converted_count: u32 = 0;

    for entry in dir.flatten() {
        let file_path = entry.path();

        if !file_path.is_file() {
            continue;
        }

        let extension = file_path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase());

        if extension != Some("srt".to_string()) {
            continue;
        }

        let file_stem = file_path
            .file_stem()
            .unwrap_or_else(|| std::ffi::OsStr::new("output"))
            .to_string_lossy();

        let new_file_path = output_path.join(format!("{}.txt", file_stem));

        match fs::read_to_string(&file_path) {
            Ok(content) => {
                let cleaned = parse_srt(&content);
                if fs::write(&new_file_path, cleaned).is_ok() {
                    converted_count += 1;
                }
            }
            Err(_) => continue,
        }
    }

    if converted_count == 0 {
        return Err("هیچ فایل SRT معتبری در این پوشه پیدا نشد.".into());
    }

    Ok(output_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_output_folder(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("پوشه خروجی وجود ندارد.".into());
    }
    opener::open(p).map_err(|e| format!("خطا در باز کردن پوشه: {}", e))?;
    Ok(())
}

fn parse_srt(content: &str) -> String {
    let mut result = String::new();

    for raw_line in content.lines() {
        let line = raw_line.trim();

        if is_ignorable_srt_line(line) {
            continue;
        }

        let cleaned_line = strip_html_tags(line);

        if cleaned_line.is_empty() {
            continue;
        }

        if !result.is_empty() {
            result.push(' ');
        }

        result.push_str(&cleaned_line);
    }

    result.trim().to_string()
}

fn is_ignorable_srt_line(line: &str) -> bool {
    if line.is_empty()
        || line.parse::<u32>().is_ok()
        || line.contains("-->")
        || is_position_line(line)
    {
        return true;
    }

    false
}

fn is_position_line(line: &str) -> bool {
    let lower = line.to_ascii_lowercase();

    lower.starts_with("x1:")
        || lower.starts_with("x2:")
        || lower.starts_with("y1:")
        || lower.starts_with("y2:")
        || lower.starts_with("w1:")
        || lower.starts_with("w2:")
        || lower.starts_with("lineposition:")
        || lower.starts_with("alignment:")
        || lower.starts_with("align:")
        || lower.starts_with("position:")
        || lower.starts_with("vertical:")
        || lower.starts_with("line:")
        || lower.starts_with("size:")
}

fn strip_html_tags(input: &str) -> String {
    let without_breaks = input
        .replace("<br>", " ")
        .replace("<br/>", " ")
        .replace("<br />", " ")
        .replace("&nbsp;", " ");

    let mut result = String::new();
    let mut inside_tag = false;

    for ch in without_breaks.chars() {
        match ch {
            '<' => inside_tag = true,
            '>' => inside_tag = false,
            _ if !inside_tag => result.push(ch),
            _ => {}
        }
    }

    result
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
