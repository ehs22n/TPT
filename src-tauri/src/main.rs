#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use tauri::{AppHandle, Emitter};
use tauri_plugin_dialog::DialogExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            convert_srt_to_txt,
            open_output_folder,
            install_ai_model,
            start_ai_model,
            translate_with_ai,
            translate_with_google,
            translate_file,
            translate_folder
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
async fn translate_with_ai(_app: AppHandle, text: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || invoke_nllb(&text))
        .await
        .map_err(|e| format!("خطا در اجرای پس‌زمینه: {}", e))?
}

#[tauri::command]
fn translate_with_google(_app: AppHandle, text: String) -> Result<String, String> {
    let result = translate_google_backend(&text)?;
    Ok(result)
}

#[allow(deprecated)]
#[tauri::command]
fn save_translation_dialog(app: AppHandle, text: String) -> Result<String, String> {
    let file_path = app.dialog()
        .file()
        .set_file_name("translation.txt")
        .add_filter("Text Files", &["txt"])
        .blocking_save_file();

    let Some(path) = file_path else { return Err("ذخیره فایل لغو شد.".into()); };

    let str_path = path.to_string();
    fs::write(Path::new(&str_path), text).map_err(|e| format!("خطا در ذخیره: {}", e))?;
    Ok(str_path)
}

fn invoke_nllb(text: &str) -> Result<String, String> {
    let url = "http://127.0.0.1:8000/translate";
    let client = reqwest::blocking::Client::new();

    let body = serde_json::json!({ "text": text });

    let resp = client
        .post(url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .map_err(|e| format!("خطا در تماس با سرور مدل: {}", e))?;

    if !resp.status().is_success() {
        return Err("سرور مدل پاسخ درستی نداد.".into());
    }

    let parsed = resp
        .json::<serde_json::Value>()
        .map_err(|e| format!("خطا در خواندن پاسخ: {}", e))?;

    parsed
        .get("text")
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| "پاسخ نامعتبر از سرور.".into())
}

fn translate_google_backend(text: &str) -> Result<String, String> {
    let encoded = urlencoding::encode(text);
    let url = format!(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q={}",
        encoded
    );

    let resp = reqwest::blocking::get(&url)
        .map_err(|e| format!("خطا در ارتباط با گوگل: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("گوگل با کد {} پاسخ داد.", resp.status()));
    }

    let body: serde_json::Value = resp
        .json()
        .map_err(|e| format!("خطا در خواندن پاسخ گوگل: {}", e))?;

    let mut result = String::new();
    if let Some(arr) = body.get(0).and_then(|v| v.as_array()) {
        for item in arr {
            if let Some(part) = item.get(0).and_then(|v| v.as_str()) {
                result.push_str(part);
            }
        }
    }

    if result.is_empty() {
        return Err("ترجمه‌ای دریافت نشد.".into());
    }

    Ok(result)
}

#[tauri::command]
fn translate_file(
    app: AppHandle,
    file_path: String,
    method: String,
) -> Result<String, String> {
    let text = fs::read_to_string(&file_path)
        .map_err(|e| format!("خطا در خواندن فایل: {}", e))?;

    let translated = match method.as_str() {
        "ai" => {
            tauri::async_runtime::block_on(async {
                let res = translate_with_ai(app.clone(), text.clone()).await;
                res
            })?
        }
        "google" => translate_google_backend(&text)?,
        _ => return Err("روش ترجمه نامعتبر.".into()),
    };

    let input = Path::new(&file_path);
    let stem = input
        .file_stem()
        .unwrap_or_else(|| std::ffi::OsStr::new("translated"))
        .to_string_lossy();

    let parent = input.parent().unwrap_or_else(|| Path::new("."));
    let out = parent.join(format!("{}_fa", stem)).with_extension("txt");

    fs::write(&out, translated)
        .map_err(|e| format!("خطا در ذخیره خروجی: {}", e))?;

    Ok(out.to_string_lossy().to_string())
}

#[tauri::command]
fn translate_folder(
    app: AppHandle,
    folder_path: String,
    method: String,
) -> Result<String, String> {
    let input = Path::new(&folder_path);
    if !input.exists() || !input.is_dir() {
        return Err("پوشه معتبر نیست.".into());
    }

    let folder_name = input
        .file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new("translated"))
        .to_string_lossy();

    let output = input.join(format!("{}_FA", folder_name));
    fs::create_dir_all(&output)
        .map_err(|e| format!("خطا در ساخت پوشه خروجی: {}", e))?;

    let mut count: u32 = 0;

    for entry in fs::read_dir(input).map_err(|e| format!("خطا در خواندن پوشه: {}", e))? {
        let entry = entry.map_err(|e| format!("خطا در خواندن فهرست: {}", e))?;
        let p = entry.path();

        if !p.is_file() {
            continue;
        }

        let ext = p.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase());
        if ext != Some("txt".to_string()) && ext != Some("srt".to_string()) {
            continue;
        }

        let content = fs::read_to_string(&p).map_err(|e| format!("خطا در خواندن فایل: {}", e))?;

        let translated = match method.as_str() {
            "ai" => tauri::async_runtime::block_on(async {
                let res = translate_with_ai(app.clone(), content.clone()).await;
                res
            })?,
            "google" => translate_google_backend(&content)?,
            _ => continue,
        };

        let stem = p.file_stem().unwrap_or_else(|| std::ffi::OsStr::new("file"));
        let out = output.join(format!("{}.txt", stem.to_string_lossy()));

        if fs::write(&out, translated).is_ok() {
            count += 1;
        }
    }

    if count == 0 {
        return Err("هیچ فایل TXT/SRT معتبری پیدا نشد.".into());
    }

    Ok(output.to_string_lossy().to_string())
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

#[tauri::command]
async fn install_ai_model(app: AppHandle, model: String) -> Result<String, String> {
    let app_clone = app.clone();
    tauri::async_runtime::spawn_blocking(move || install_ai_model_blocking(model, app_clone))
        .await
        .map_err(|e| format!("خطا در اجرای پس‌زمینه: {}", e))?
}

#[tauri::command]
async fn start_ai_model(app: AppHandle, model: String) -> Result<String, String> {
    let app_clone = app.clone();
    tauri::async_runtime::spawn_blocking(move || start_ai_model_blocking(model, app_clone))
        .await
        .map_err(|e| format!("خطا در اجرای پس‌زمینه: {}", e))?
}

fn install_ai_model_blocking(model: String, app: AppHandle) -> Result<String, String> {
    let model_repo = validate_model(&model)?;
    emit_ai_log(&app, format!("شروع نصب مدل {model}"));
    emit_ai_progress(&app, 0);

    let python = ensure_python_with_events(&app)?;
    emit_ai_progress(&app, 10);
    let ai_dir = ai_dir()?;
    let venv_python = ensure_ai_venv_with_events(&python, &app)?;
    emit_ai_progress(&app, 25);

    emit_ai_log(&app, format!("محیط مجازی آماده است: {}", venv_python.display()));
    ensure_ai_dependencies_with_events(&venv_python, &ai_dir, &app)?;
    emit_ai_progress(&app, 55);

    if is_model_cached(model_repo)? {
        emit_ai_log(&app, format!("مدل {model} از قبل دانلود شده و آماده استفاده است."));
        emit_ai_progress(&app, 100);
        return Ok(format!("مدل {model} از قبل روی سیستم موجود است و دوباره دانلود نشد."));
    }

    emit_ai_log(&app, "در حال دانلود مدل NLLB...");
    emit_ai_progress(&app, 60);
    let output = run_python_with_env_with_events(
        &venv_python,
        &ai_dir,
        &["install.py", "--download-only"],
        &[("AI_MODEL", model_repo)],
        &app,
    )?;
    emit_ai_progress(&app, 90);

    if !is_model_cached(model_repo)? {
        return Err("دانلود مدل ظاهراً کامل نشده است. لطفاً دوباره تلاش کنید.".into());
    }

    emit_ai_progress(&app, 100);
    Ok(format!("مدل {model} با موفقیت دانلود شد.\n{}", summarize_output(&output)))
}

fn start_ai_model_blocking(model: String, app: AppHandle) -> Result<String, String> {
    let model_repo = validate_model(&model)?;
    emit_ai_log(&app, format!("شروع راه‌اندازی FastAPI برای مدل {model}"));
    emit_ai_progress(&app, 0);

    let python = ensure_python_with_events(&app)?;
    emit_ai_progress(&app, 15);
    let ai_dir = ai_dir()?;
    let venv_python = ensure_ai_venv_with_events(&python, &app)?;
    emit_ai_progress(&app, 35);

    ensure_ai_dependencies_with_events(&venv_python, &ai_dir, &app)?;
    emit_ai_progress(&app, 65);

    let child = Command::new(&venv_python)
        .current_dir(&ai_dir)
        .env("AI_MODEL", model_repo)
        .args(["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8000"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("خطا در اجرای FastAPI: {}", e))?;

    emit_ai_progress(&app, 100);
    Ok(format!("سرور FastAPI برای مدل {model} اجرا شد.\nPID: {}\nآدرس: http://127.0.0.1:8000", child.id()))
}

fn validate_model(model: &str) -> Result<&'static str, String> {
    if model == "nllb-200-distilled-600M" {
        Ok("facebook/nllb-200-distilled-600M")
    } else {
        Err("این مدل در لیست فعال پشتیبانی نمی‌شود.".into())
    }
}

fn ai_dir() -> Result<PathBuf, String> {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("ai");
    if dir.exists() { Ok(dir) } else { Err("پوشه ai پیدا نشد.".into()) }
}

fn ensure_python_with_events(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(python) = find_python() {
        emit_ai_log(app, format!("پایتون پیدا شد: {}", python.display()));
        return Ok(python);
    }

    emit_ai_log(app, "پایتون پیدا نشد. در حال آماده‌سازی Miniconda...");
    let python_home = bundled_python_home()?;
    let python = if cfg!(windows) { python_home.join("python.exe") } else { python_home.join("bin").join("python") };

    if python.exists() {
        emit_ai_log(app, format!("پایتون آماده است: {}", python.display()));
        return Ok(python);
    }

    fs::create_dir_all(&python_home).map_err(|e| format!("خطا در ساخت پوشه پایتون: {}", e))?;
    let (installer_url, installer_name) = python_installer();
    let installer_path = python_home.join(installer_name);

    if !installer_path.exists() {
        download_file_with_progress(installer_url, &installer_path, app)?;
    }

    if cfg!(windows) {
        install_miniconda_windows(&installer_path, &python_home, app)?;
    } else {
        install_miniconda_linux(&installer_path, &python_home, app)?;
    }

    if python.exists() {
        emit_ai_log(app, format!("پایتون نصب شد: {}", python.display()));
        Ok(python)
    } else {
        Err("پایتون نصب شد، اما فایل اجرایی آن پیدا نشد.".into())
    }
}

fn ensure_ai_venv_with_events(python: &Path, app: &AppHandle) -> Result<PathBuf, String> {
    let python_home = bundled_python_home()?;
    let venv_dir = python_home.join("ai-venv");
    let venv_python = if cfg!(windows) { venv_dir.join("Scripts").join("python.exe") } else { venv_dir.join("bin").join("python") };

    if !venv_python.exists() {
        emit_ai_log(app, format!("در حال ساخت محیط مجازی: {}", venv_dir.display()));
        let mut command = Command::new(python);
        command.args(["-m", "venv"]).arg(&venv_dir);
        run_command_with_events(command, app).map_err(|e| format!("خطا در ساخت محیط مجازی پایتون: {e}"))?;
    } else {
        emit_ai_log(app, format!("محیط مجازی آماده است: {}", venv_dir.display()));
    }

    if venv_python.exists() { Ok(venv_python) } else { Err("محیط مجازی ساخته شد، اما فایل اجرایی پایتون داخل آن پیدا نشد.".into()) }
}

fn ensure_ai_dependencies_with_events(venv_python: &Path, ai_dir: &Path, app: &AppHandle) -> Result<(), String> {
    let marker = ai_dependencies_marker()?;
    if marker.exists() {
        emit_ai_log(app, "کتابخانه‌های Python از قبل نصب هستند.");
        return Ok(());
    }

    emit_ai_log(app, "در حال ارتقای pip داخل محیط مجازی...");
    run_python_with_events(venv_python, ai_dir, &["-m", "pip", "install", "--upgrade", "pip"], app)?;

    emit_ai_log(app, "در حال نصب کتابخانه‌های پایتونی داخل محیط مجازی...");
    run_python_with_events(venv_python, ai_dir, &["-m", "pip", "install", "torch", "transformers", "sentencepiece", "fastapi", "uvicorn"], app)?;

    fs::write(&marker, "deps-v1").map_err(|e| format!("خطا در ثبت وضعیت dependencies: {}", e))?;
    emit_ai_log(app, "نصب کتابخانه‌ها کامل شد.");
    Ok(())
}

fn find_python() -> Option<PathBuf> {
    for name in ["python", "python3"] {
        if let Ok(output) = Command::new(name).arg("--version").output() {
            if output.status.success() { return Some(PathBuf::from(name)); }
        }
    }
    None
}

fn bundled_python_home() -> Result<PathBuf, String> {
    let base = if cfg!(windows) { env::var("LOCALAPPDATA").or_else(|_| env::var("APPDATA")).map_err(|_| "متغیر LOCALAPPDATA پیدا نشد.".to_string())? } else { env::var("HOME").map_err(|_| "متغیر HOME پیدا نشد.".to_string())? };
    Ok(PathBuf::from(base).join(if cfg!(windows) { "tpt-python" } else { ".tpt-python" }))
}

fn ai_dependencies_marker() -> Result<PathBuf, String> {
    Ok(bundled_python_home()?.join("ai-venv").join(".deps_ready_v1"))
}

fn huggingface_cache_root() -> Result<PathBuf, String> {
    if cfg!(windows) {
        env::var("LOCALAPPDATA").or_else(|_| env::var("APPDATA")).map_err(|_| "متغیر LOCALAPPDATA پیدا نشد.".to_string()).map(|base| PathBuf::from(base).join("huggingface"))
    } else {
        env::var("HOME").map_err(|_| "متغیر HOME پیدا نشد.".to_string()).map(|home| PathBuf::from(home).join(".cache").join("huggingface"))
    }
}

fn is_model_cached(model_repo: &str) -> Result<bool, String> {
    let repo_slug = model_repo.replace('/', "--");
    let model_dir = huggingface_cache_root()?.join("hub").join(format!("models--{repo_slug}")).join("snapshots");
    if !model_dir.exists() { return Ok(false); }
    fs::read_dir(&model_dir).map(|mut entries| entries.next().is_some()).map_err(|e| format!("خطا در بررسی مدل: {}", e))
}

fn python_installer() -> (&'static str, &'static str) {
    if cfg!(windows) {
        ("https://repo.anaconda.com/miniconda/Miniconda3-py312_24.9.2-0-Windows-x86_64.exe", "miniconda-installer.exe")
    } else {
        ("https://repo.anaconda.com/miniconda/Miniconda3-py312_24.9.2-0-Linux-x86_64.sh", "miniconda-installer.sh")
    }
}

fn download_file_with_progress(url: &str, target: &Path, app: &AppHandle) -> Result<(), String> {
    emit_ai_log(app, format!("در حال دانلود: {url}"));
    let mut response = reqwest::blocking::get(url).map_err(|e| format!("خطا در دانلود: {}", e))?;
    if !response.status().is_success() { return Err(format!("دانلود با خطای {} مواجه شد.", response.status())); }
    let total = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut last_percent = -1.0;
    let mut file = fs::File::create(target).map_err(|e| format!("خطا در ساخت فایل دانلود: {}", e))?;
    let mut buffer = [0u8; 64 * 1024];

    loop {
        let read = response.read(&mut buffer).map_err(|e| format!("خطا در خواندن دانلود: {}", e))?;
        if read == 0 { break; }
        file.write_all(&buffer[..read]).map_err(|e| format!("خطا در ذخیره دانلود: {}", e))?;
        downloaded += read as u64;
        if total > 0 {
            let percent = (downloaded as f64 / total as f64) * 100.0;
            if percent - last_percent >= 1.0 {
                emit_ai_log(app, format!("دانلود پایتون: {percent:.1}%"));
                last_percent = percent;
            }
        }
    }
    emit_ai_log(app, "دانلود کامل شد.");
    Ok(())
}

fn install_miniconda_windows(installer: &Path, python_home: &Path, app: &AppHandle) -> Result<(), String> {
    emit_ai_log(app, "در حال اجرای نصب‌کننده Miniconda برای ویندوز...");
    let home_arg = format!("/D={}", python_home.to_string_lossy());
    let mut command = Command::new(installer);
    command.args(["/S", &home_arg]);
    run_command_with_events(command, app)?;
    Ok(())
}

fn install_miniconda_linux(installer: &Path, python_home: &Path, app: &AppHandle) -> Result<(), String> {
    emit_ai_log(app, "در حال اجرای نصب‌کننده Miniconda برای لینوکس...");
    let mut command = Command::new("bash");
    command.arg(installer).arg("-b").arg("-p").arg(python_home);
    run_command_with_events(command, app)?;
    Ok(())
}

fn run_python_with_events(python: &Path, cwd: &Path, args: &[&str], app: &AppHandle) -> Result<String, String> {
    run_python_with_env_with_events(python, cwd, args, &[], app)
}

fn run_python_with_env_with_events(python: &Path, cwd: &Path, args: &[&str], envs: &[(&str, &str)], app: &AppHandle) -> Result<String, String> {
    let mut command = Command::new(python);
    command.current_dir(cwd).args(args);
    for (name, value) in envs { command.env(name, value); }
    run_command_with_events(command, app)
}

fn run_command_with_events(mut command: Command, app: &AppHandle) -> Result<String, String> {
    let mut child = command.stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().map_err(|e| format!("خطا در اجرای دستور: {}", e))?;
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let app_stdout = app.clone();
    let app_stderr = app.clone();
    let stdout_reader = read_stream_lines(stdout.map(BufReader::new), app_stdout);
    let stderr_reader = read_stream_lines(stderr.map(BufReader::new), app_stderr);
    let status = child.wait().map_err(|e| format!("خطا در انتظار پایان دستور: {}", e))?;
    let mut result = String::new();
    result.push_str(&join_reader(stdout_reader));
    result.push_str(&join_reader(stderr_reader));
    if !status.success() { return Err(result.trim().to_string()); }
    Ok(result)
}

fn read_stream_lines<R>(reader: Option<R>, app: AppHandle) -> thread::JoinHandle<String>
where
    R: BufRead + Send + 'static,
{
    thread::spawn(move || {
        let mut output = String::new();
        if let Some(mut reader) = reader {
            let mut line = String::new();
            loop {
                line.clear();
                match reader.read_line(&mut line) {
                    Ok(0) => break,
                    Ok(_) => {
                        let trimmed = line.trim_end_matches(&['\r', '\n'][..]);
                        if !trimmed.is_empty() {
                            output.push_str(trimmed);
                            output.push('\n');
                            emit_ai_log(&app, trimmed.to_string());
                        }
                    }
                    Err(e) => {
                        output.push_str(&format!("خطا در خواندن خروجی: {e}\n"));
                        emit_ai_log(&app, format!("خطا در خواندن خروجی: {e}"));
                        break;
                    }
                }
            }
        }
        output
    })
}

fn join_reader(handle: thread::JoinHandle<String>) -> String {
    handle.join().unwrap_or_else(|_| "خطا در خواندن خروجی دستور.\n".to_string())
}

fn emit_ai_log(app: &AppHandle, message: impl Into<String>) {
    let _ = app.emit("ai-log", message.into());
}

fn emit_ai_progress(app: &AppHandle, progress: u8) {
    let _ = app.emit("ai-progress", progress.min(100));
}

fn summarize_output(output: &str) -> String {
    let trimmed = output.trim();
    if trimmed.is_empty() { return "بدون خروجی اضافی".to_string(); }
    if trimmed.chars().count() <= 1200 { return trimmed.to_string(); }
    let tail = trimmed.chars().rev().take(1200).collect::<Vec<_>>().into_iter().rev().collect::<String>();
    format!("...\n{tail}")
}

fn parse_srt(content: &str) -> String {
    let mut result = String::new();
    for raw_line in content.lines() {
        let line = raw_line.trim();
        if is_ignorable_srt_line(line) { continue; }
        let cleaned_line = strip_html_tags(line);
        if cleaned_line.is_empty() { continue; }
        if !result.is_empty() { result.push(' '); }
        result.push_str(&cleaned_line);
    }
    result.trim().to_string()
}

fn is_ignorable_srt_line(line: &str) -> bool {
    line.is_empty() || line.parse::<u32>().is_ok() || line.contains("-->") || is_position_line(line)
}

fn is_position_line(line: &str) -> bool {
    let lower = line.to_ascii_lowercase();
    lower.starts_with("x1:") || lower.starts_with("x2:") || lower.starts_with("y1:") || lower.starts_with("y2:")
        || lower.starts_with("w1:") || lower.starts_with("w2:") || lower.starts_with("lineposition:")
        || lower.starts_with("alignment:") || lower.starts_with("align:") || lower.starts_with("position:")
        || lower.starts_with("vertical:") || lower.starts_with("line:") || lower.starts_with("size:")
}

fn strip_html_tags(input: &str) -> String {
    let without_breaks = input.replace("<br>", " ").replace("<br/>", " ").replace("<br />", " ").replace("&nbsp;", " ");
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
    result.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").split_whitespace().collect::<Vec<_>>().join(" ")
}
