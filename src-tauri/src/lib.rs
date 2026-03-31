// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn deploy_local_agent(
    run_mode: String,
    root_password: String,
    port: u16,
    modules: Vec<String>,
) -> Result<String, String> {
    let modules_arg = modules.join(",");

    match run_mode.as_str() {
        "docker" => {
            // Remove any existing container first (ignore failure if it doesn't exist)
            let _ = std::process::Command::new("docker")
                .args(["rm", "-f", "prl-devops-agent"])
                .output();

            let port_mapping = format!("{port}:3080");
            let root_password_env = format!("ROOT_PASSWORD={root_password}");
            let modules_env = format!("MODULES={modules_arg}");
            let mut args = vec![
                "run", "-d",
                "--name", "prl-devops-agent",
                "--restart", "unless-stopped",
                "-p", &port_mapping,
                "-e", &root_password_env,
            ];
            if !modules_arg.is_empty() {
                args.extend(["-e", modules_env.as_str()]);
            }
            args.push("ghcr.io/parallels/prl-devops-service:latest");

            let output = std::process::Command::new("docker")
                .args(&args)
                .output()
                .map_err(|e| format!("Failed to launch Docker: {e}"))?;

            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        }
        "service" => {
            let modules_flag = if modules_arg.is_empty() {
                String::new()
            } else {
                format!(" --modules {modules_arg}")
            };
            let script = format!(
                "echo '{root_password}' | sudo -S bash -c \"curl -fsSL https://get.parallels.dev | bash -s -- --root-password '{root_password}' --port {port}{modules_flag}\""
            );

            let output = std::process::Command::new("sh")
                .args(["-c", &script])
                .output()
                .map_err(|e| format!("Failed to launch installer: {e}"))?;

            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        }
        _ => Err(format!("Unknown run mode: {run_mode}")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                use sha2::{Digest, Sha256};
                let mut hasher = Sha256::new();
                hasher.update(password.as_bytes());
                let result = hasher.finalize();
                result.to_vec()
            })
            .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, deploy_local_agent])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
