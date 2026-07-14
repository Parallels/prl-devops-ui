use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use flate2::read::GzDecoder;
use log::{debug, error, info};
use semver::Version;
use serde::{Deserialize, Serialize};
use tar::Archive;

const GITHUB_REPO: &str = "Parallels/prl-devops-service";
const ASSET_PREFIX: &str = "prldevops--";
const APP_DATA_SUBDIR: &str = "binary-service";
const BINARY_NAME_UNIX: &str = "prldevops";
const BINARY_NAME_WINDOWS: &str = "prldevops.exe";

/// Status returned to the frontend about the binary service state.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BinaryServiceStatus {
    pub available: bool,
    pub local_version: Option<String>,
    pub latest_version: Option<String>,
    pub binary_path: String,
    pub error: Option<String>,
}

impl BinaryServiceStatus {
    fn unavailable(error: &str, binary_path: &str) -> Self {
        Self {
            available: false,
            local_version: None,
            latest_version: None,
            binary_path: binary_path.to_string(),
            error: Some(error.to_string()),
        }
    }
}

/// Map the current OS to the GitHub platform string used in asset names.
fn os_to_platform() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "linux" => "linux",
        "windows" => "windows",
        _ => "",
    }
}

/// Map the current architecture to the GitHub arch string used in asset names.
fn arch_to_github_arch() -> &'static str {
    match std::env::consts::ARCH {
        "x86_64" => "amd64",
        "aarch64" => "arm64",
        "i686" => "386",
        _ => "",
    }
}

/// Build the GitHub release asset name for the current platform.
/// Returns None if the platform/arch is not supported.
pub fn get_platform_asset_name() -> Option<String> {
    let platform = os_to_platform();
    let arch = arch_to_github_arch();
    if platform.is_empty() || arch.is_empty() {
        return None;
    }
    Some(format!(
        "{}{}-{}.tar.gz",
        ASSET_PREFIX, platform, arch
    ))
}

/// Construct the GitHub CDN download URL for a given release tag and asset name.
pub fn get_asset_download_url(tag: &str, asset_name: &str) -> String {
    let tag = tag.trim_start_matches('v');
    format!(
        "https://github.com/{}/releases/download/v{}/{}",
        GITHUB_REPO, tag, asset_name
    )
}

/// Construct the GitHub API URL for the latest release.
fn get_latest_release_api_url() -> String {
    format!("https://api.github.com/repos/{}/releases/latest", GITHUB_REPO)
}

/// Parse a version string, stripping a leading 'v' if present.
fn parse_version(s: &str) -> Result<Version, String> {
    let s = s.trim_start_matches('v');
    Version::parse(s).map_err(|e| format!("Invalid version '{}': {}", s, e))
}

/// Fetch the latest release tag from GitHub.
/// Uses the GitHub API, falls back to redirecting to the latest release page.
pub async fn get_latest_release_tag() -> Result<String, String> {
    let api_url = get_latest_release_api_url();
    info!("[BinaryService] GitHub API URL: {}", api_url);

    let resp = http_client()
        .get(&api_url)
        .send()
        .await
        .map_err(|e| {
            error!("[BinaryService] Failed to fetch latest release from GitHub API: {}", e);
            format!("Failed to fetch latest release from GitHub API: {}", e)
        })?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        error!("[BinaryService] GitHub API returned status {}: {}", status, body);
        return Err(format!(
            "GitHub API returned status {}: {}",
            status, body
        ));
    }

    let body_text = resp.text().await.map_err(|e| {
        error!("[BinaryService] Failed to parse release response body: {}", e);
        format!("Failed to parse release JSON: {}", e)
    })?;
    debug!("[BinaryService] GitHub API response: {}", body_text);

    let body: serde_json::Value = serde_json::from_str(&body_text).map_err(|e| {
        error!("[BinaryService] Failed to deserialize release response: {}", e);
        format!("Failed to deserialize release response: {}", e)
    })?;

    let tag = body
        .get("tag_name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            let msg = "No tag_name found in GitHub release response".to_string();
            error!("[BinaryService] {}", msg);
            msg
        })?;

    info!("[BinaryService] Fetched latest tag: {}", tag);
    Ok(tag.to_string())
}

/// Get the app data directory path for storing the binary.
pub fn get_binary_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(APP_DATA_SUBDIR)
}

/// Get the path where the binary should be stored.
pub fn get_binary_path(app_data_dir: &Path) -> PathBuf {
    let dir = get_binary_dir(app_data_dir);
    let name = if cfg!(target_os = "windows") {
        BINARY_NAME_WINDOWS
    } else {
        BINARY_NAME_UNIX
    };
    dir.join(name)
}

/// Get the path for the local version state file.
pub fn get_version_file_path(app_data_dir: &Path) -> PathBuf {
    get_binary_dir(app_data_dir).join("version.json")
}

/// Load the locally stored version.
pub fn load_local_version(app_data_dir: &Path) -> Result<Option<String>, String> {
    let path = get_version_file_path(app_data_dir);
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read version file: {}", e))?;
    let parsed: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse version file: {}", e))?;

    match parsed.get("version").and_then(|v| v.as_str()) {
        Some(s) => Ok(Some(s.to_string())),
        None => Err("Invalid version file format".to_string()),
    }
}

/// Save the current version to disk.
pub fn save_local_version(app_data_dir: &Path, version: &str) -> Result<(), String> {
    let dir = get_binary_dir(app_data_dir);
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create binary directory: {}", e))?;

    let path = get_version_file_path(app_data_dir);
    let json = serde_json::json!({ "version": version });
    let content = serde_json::to_string_pretty(&json).map_err(|e| format!("Failed to serialize version: {}", e))?;

    fs::write(&path, content).map_err(|e| format!("Failed to write version file: {}", e))?;
    Ok(())
}

/// Check if the binary exists and is executable.
pub fn binary_exists(app_data_dir: &Path) -> bool {
    let path = get_binary_path(app_data_dir);
    path.exists()
}

/// Set execute permission on the binary (Unix only).
pub fn set_execute_permission(binary_path: &Path) -> Result<(), String> {
    if cfg!(target_os = "windows") {
        return Ok(());
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = fs::metadata(binary_path)
            .map_err(|e| format!("Failed to read binary metadata: {}", e))?;
        let mut perms = perms.permissions();
        let mode = perms.mode() | 0o111; // add execute bits for owner/group/other
        perms.set_mode(mode);
        fs::set_permissions(binary_path, perms)
            .map_err(|e| format!("Failed to set execute permission: {}", e))?;
    }

    #[cfg(not(unix))]
    {
        let _ = binary_path;
    }

    Ok(())
}

/// Download a file from the given URL to a temp path, returning the temp path.
pub async fn download_file(url: &str, dest_dir: &Path) -> Result<PathBuf, String> {
    fs::create_dir_all(dest_dir).map_err(|e| format!("Failed to create temp directory: {}", e))?;

    let temp_path = dest_dir.join(format!("download_{}.tmp", uuid_now()));
    info!("[BinaryService] Downloading to temp file: {:?}", temp_path);

    let resp = http_client()
        .get(url)
        .send()
        .await
        .map_err(|e| {
            error!("[BinaryService] HTTP request failed for {}: {}", url, e);
            format!("Failed to download from {}: {}", url, e)
        })?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        error!("[BinaryService] Download failed with status {}: {}", status, body);
        return Err(format!(
            "Download failed with status {}: {}",
            status, body
        ));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read download bytes: {}", e))?;
    info!("[BinaryService] Downloaded {} bytes", bytes.len());

    fs::write(&temp_path, &bytes)
        .map_err(|e| format!("Failed to write download to temp file: {}", e))?;

    Ok(temp_path)
}

/// Extract the tar.gz file and return the path of the extracted binary.
pub fn extract_tar_gz(tar_gz_path: &Path, dest_dir: &Path) -> Result<PathBuf, String> {
    info!("[BinaryService] Extracting tar.gz from: {:?}", tar_gz_path);

    let file = fs::File::open(tar_gz_path)
        .map_err(|e| format!("Failed to open tar.gz file: {}", e))?;
    let decoder = GzDecoder::new(file);
    let mut archive = Archive::new(decoder);

    let expected_name = if cfg!(target_os = "windows") {
        BINARY_NAME_WINDOWS.to_string()
    } else {
        BINARY_NAME_UNIX.to_string()
    };

    let mut found_binary: Option<PathBuf> = None;

    for entry_result in archive.entries().map_err(|e| format!("Failed to read tar archive: {}", e))? {
        let mut entry = entry_result.map_err(|e| format!("Failed to read archive entry: {}", e))?;
        let entry_path = entry.path().map_err(|e| format!("Invalid entry path: {}", e))?;
        debug!("[BinaryService] Archive entry: {:?}", entry_path);

        // Skip directories
        let file_name = match entry_path.file_name() {
            Some(name) => name,
            None => continue,
        };

        if file_name.to_str() == Some(expected_name.as_str()) {
            let dest_path = dest_dir.join(file_name);
            info!("[BinaryService] Found binary '{}', extracting to {:?}", expected_name, dest_path);

            // Write the file directly to avoid tar security checks on flat archives
            let mut outfile = fs::File::create(&dest_path)
                .map_err(|e| format!("Failed to create output file: {}", e))?;
            io::copy(&mut entry, &mut outfile)
                .map_err(|e| format!("Failed to write binary content: {}", e))?;
            drop(outfile);

            // Set permissions on Unix
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let perms = fs::metadata(&dest_path)
                    .map_err(|e| format!("Failed to read metadata: {}", e))?;
                let mut perms = perms.permissions();
                let mode = perms.mode() | 0o755;
                perms.set_mode(mode);
                fs::set_permissions(&dest_path, perms)
                    .map_err(|e| format!("Failed to set permissions: {}", e))?;
            }

            found_binary = Some(dest_path);
        }
    }

    match found_binary {
        Some(path) => {
            info!("[BinaryService] Binary extracted to: {:?}", path);
            Ok(path)
        }
        None => {
            let msg = format!("No binary file '{}' found in archive", expected_name);
            error!("[BinaryService] {}", msg);
            Err(msg)
        }
    }
}

/// Clean up a temp file if it exists.
fn cleanup_temp(path: &Path) {
    if path.exists() {
        let _ = fs::remove_file(path);
    }
}

/// Generate a simple UUID-like string for temp file naming.
fn uuid_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!(
        "{:x}_{:x}",
        duration.as_secs(),
        duration.subsec_nanos()
    )
}

/// Build the HTTP client for downloads.
fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300)) // 5 minute timeout
        .user_agent("Parallels-DevOps-UI/1.0")
        .build()
        .expect("Failed to build HTTP client")
}

/// Ensure the binary service is installed and up to date.
/// This is the main entry point called from the Tauri command.
pub async fn ensure_binary_service(app_data_dir: &Path) -> Result<BinaryServiceStatus, String> {
    let binary_dir = get_binary_dir(app_data_dir);
    let binary_path = get_binary_path(app_data_dir);
    let binary_path_str = binary_path.to_string_lossy().to_string();

    info!("[BinaryService] Starting binary service initialization");
    info!("[BinaryService] App data dir: {:?}", app_data_dir);
    info!("[BinaryService] Binary dir: {:?}", binary_dir);
    info!("[BinaryService] Binary path: {:?}", binary_path);

    // Ensure binary directory exists
    fs::create_dir_all(&binary_dir).map_err(|e| {
        error!("[BinaryService] Failed to create binary directory: {}", e);
        format!("Failed to create binary directory: {}", e)
    })?;

    // Get local version
    let local_version = load_local_version(app_data_dir)?;
    info!("[BinaryService] Local version: {:?}", local_version);

    // Fetch latest release tag from GitHub
    info!("[BinaryService] Fetching latest release from GitHub...");
    let latest_tag = get_latest_release_tag().await?;
    info!("[BinaryService] Latest release tag: {}", latest_tag);

    let local_needs_update = match (&local_version, &latest_tag) {
        (Some(local), _) => {
            // Strip 'v' prefix for comparison
            let local_clean = local.trim_start_matches('v');
            let latest_clean = latest_tag.trim_start_matches('v');
            let needs = local_clean != latest_clean;
            info!("[BinaryService] Local version '{}' vs latest '{}', needs update: {}", local_clean, latest_clean, needs);
            needs
        }
        (None, _) => {
            info!("[BinaryService] No local version found, needs download");
            true
        }
    };

    if local_needs_update {
        info!("[BinaryService] Update needed, downloading binary...");

        // Need to download the binary
        let asset_name = get_platform_asset_name().ok_or_else(|| {
            let msg = format!(
                "Unsupported platform: {}-{}",
                std::env::consts::OS,
                std::env::consts::ARCH
            );
            error!("[BinaryService] {}", msg);
            msg
        })?;

        info!("[BinaryService] Asset name: {}", asset_name);

        let download_url = get_asset_download_url(&latest_tag, &asset_name);
        info!("[BinaryService] Download URL: {}", download_url);

        // Download the tar.gz
        let temp_path = download_file(&download_url, &binary_dir).await
            .map_err(|e| {
                error!("[BinaryService] Download failed: {}", e);
                e
            })?;
        info!("[BinaryService] Downloaded to: {:?}", temp_path);

        // Extract the tar.gz
        let extracted_path = extract_tar_gz(&temp_path, &binary_dir)
            .map_err(|e| {
                error!("[BinaryService] Extraction failed: {}", e);
                e
            })?;
        info!("[BinaryService] Extracted binary to: {:?}", extracted_path);

        // Clean up temp file
        cleanup_temp(&temp_path);

        // Move extracted binary to final location if needed
        if extracted_path != binary_path {
            if binary_path.exists() {
                fs::remove_file(&binary_path).map_err(|e| format!("Failed to remove old binary: {}", e))?;
            }
            fs::rename(&extracted_path, &binary_path).map_err(|e| format!("Failed to move binary: {}", e))?;
        }

        // Set execute permission on Unix
        set_execute_permission(&binary_path)?;
        info!("[BinaryService] Set execute permission on binary");

        // Save the new version
        save_local_version(app_data_dir, &latest_tag)?;
        info!("[BinaryService] Saved version '{}' to disk", latest_tag);
    } else {
        info!("[BinaryService] Binary is up to date, no download needed");
    }

    // Verify the binary exists after all operations
    if !binary_exists(app_data_dir) {
        let msg = "Binary file not found after processing".to_string();
        error!("[BinaryService] {}", msg);
        return Ok(BinaryServiceStatus::unavailable(
            &msg,
            &binary_path_str,
        ));
    }

    info!("[BinaryService] Binary service ready at: {}", binary_path_str);

    Ok(BinaryServiceStatus {
        available: true,
        local_version,
        latest_version: Some(latest_tag),
        binary_path: binary_path_str.clone(),
        error: None,
    })
}