#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            translate_with_llama,
            translate_file_llama,
            translate_folder_llama,
            convert_srt_to_txt,
            open_output_folder,
            start_llama_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn start_llama_server(app: tauri::AppHandle) -> Result<String, String> {
    let llama_name = if cfg!(windows) {
        "binaries/windows/llama-server.exe"
    } else {
        "binaries/linux/llama-server"
    };
    let llama_path = resolve_resource_path(&app, llama_name)?;
    let llama_dir = llama_path
        .parent()
        .ok_or_else(|| format!("مسیر نامعتبر llama-server: {}", llama_path.display()))?;

    if !llama_path.exists() {
        return Err(format!("فایل باینری LLM پیدا نشد: {}", llama_path.display()));
    }

    let model_path = resolve_resource_path(&app, "model/Qwen3-8B-Q4_K_M.gguf")?;
    if !model_path.exists() {
        return Err(format!("فایل مدل پیدا نشد: {}", model_path.display()));
    }

    let path_separator = std::path::MAIN_SEPARATOR;
    let existing_path = std::env::var("PATH").unwrap_or_default();
    let new_path = format!("{}{}{}", llama_dir.display(), path_separator, existing_path);

    let mut command = Command::new(&llama_path);
    command
        .current_dir(llama_dir)
        .env("PATH", new_path);

    if !cfg!(windows) {
        let existing_ld_library_path = std::env::var("LD_LIBRARY_PATH").unwrap_or_default();
        let new_ld_library_path =
            format!("{}{}{}", llama_dir.display(), path_separator, existing_ld_library_path);
        command.env("LD_LIBRARY_PATH", new_ld_library_path);
    }

    let child = command
        .arg("--model")
        .arg(&model_path)
        .arg("--port")
        .arg("8080")
        .arg("--ctx-size")
        .arg("8192")
        .arg("--threads")
        .arg("6")
        .arg("--threads-batch")
        .arg("6")
        .spawn()
        .map_err(|e| format!("خطا در اجرای سرور LLM: {}", e))?;

    std::thread::sleep(Duration::from_secs(2));

    Ok(format!("سرور LLM شروع شد.\nPID: {}", child.id()))
}

fn resolve_resource_path(app: &tauri::AppHandle, resource_path: &str) -> Result<PathBuf, String> {
    app.path()
        .resolve(resource_path, tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("خطا در پیدا کردن فایل {}: {}", resource_path, e))
}

#[tauri::command]
fn translate_with_llama(text: String) -> Result<String, String> {
    let client = reqwest::blocking::Client::new();
    let body = serde_json::json!({
        "messages": [
            {"role": "system", "content": "You are a professional translator. Translate the following English text to Persian (Farsi). Output ONLY the Persian translation. No explanations, no original text, no notes."},
            {"role": "user", "content": format!("English: {}\n\nPersian:", text)}
        ],
        "stream": false
    });

    let resp = client
        .post("http://127.0.0.1:8080/v1/chat/completions")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .map_err(|e| format!("خطا در ارتباط با سرور LLM: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("سرور LLM با کد {} پاسخ داد.", resp.status()));
    }

    let json: serde_json::Value = resp.json().map_err(|e| format!("خطا در خواندن پاسخ LLM: {}", e))?;
    json.get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|msg| msg.get("content"))
        .and_then(|v| v.as_str())
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .ok_or_else(|| "پاسخ نامعتبر از سرور LLM.".to_string())
}

#[tauri::command]
fn translate_file_llama(file_path: String) -> Result<String, String> {
    let text = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("خطا در خواندن فایل: {}", e))?;

    let translated = translate_with_llama(text)?;

    let input = std::path::Path::new(&file_path);
    let stem = input
        .file_stem()
        .unwrap_or_else(|| std::ffi::OsStr::new("translated"))
        .to_string_lossy();

    let parent = input.parent().unwrap_or_else(|| std::path::Path::new("."));
    let out = parent.join(format!("{}_llama", stem)).with_extension("txt");

    std::fs::write(&out, translated)
        .map_err(|e| format!("خطا در ذخیره خروجی: {}", e))?;

    Ok(out.to_string_lossy().to_string())
}

#[tauri::command]
fn translate_folder_llama(folder_path: String) -> Result<String, String> {
    let input = std::path::Path::new(&folder_path);
    if !input.exists() || !input.is_dir() {
        return Err("پوشه معتبر نیست.".into());
    }

    let folder_name = input
        .file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new("translated"))
        .to_string_lossy();

    let output = input.join(format!("{}_LLAMA", folder_name));
    std::fs::create_dir_all(&output)
        .map_err(|e| format!("خطا در ساخت پوشه خروجی: {}", e))?;

    let mut count: u32 = 0;

    for entry in std::fs::read_dir(input).map_err(|e| format!("خطا در خواندن پوشه: {}", e))? {
        let entry = entry.map_err(|e| format!("خطا در خواندن فهرست: {}", e))?;
        let p = entry.path();

        if !p.is_file() {
            continue;
        }

        let ext = p.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase());
        if ext != Some("txt".to_string()) && ext != Some("srt".to_string()) {
            continue;
        }

        let content = std::fs::read_to_string(&p).map_err(|e| format!("خطا در خواندن فایل: {}", e))?;

        let translated = translate_with_llama(content)?;

        let stem = p.file_stem().unwrap_or_else(|| std::ffi::OsStr::new("file"));
        let out = output.join(format!("{}_llama.txt", stem.to_string_lossy()));

        if std::fs::write(&out, translated).is_ok() {
            count += 1;
        }
    }

    if count == 0 {
        return Err("هیچ فایل TXT/SRT معتبری پیدا نشد.".into());
    }

    Ok(output.to_string_lossy().to_string())
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
    tauri_plugin_opener::open_path(p, Some("xdg-open"))
        .map_err(|e| format!("خطا در باز کردن پوشه: {}", e))?;
    Ok(())
}

fn parse_srt(content: &str) -> String {
    let mut result = String::new();

    for raw_line in content.lines() {
        let line = raw_line.trim();

        if line.is_empty()
            || line.parse::<u32>().is_ok()
            || line.contains("-->")
            || is_position_line(line)
        {
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