use tauri_plugin_shell::ShellExt;
use tauri::Manager;

struct BackendPort(u16);

#[tauri::command]
fn get_backend_port(port: tauri::State<'_, BackendPort>) -> u16 {
  port.0
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Find a free port dynamically by binding to port 0
      let port = match std::net::TcpListener::bind("127.0.0.1:0") {
        Ok(listener) => listener.local_addr().map(|addr| addr.port()).unwrap_or(3001),
        Err(_) => 3001,
      };

      // Manage the port state so the frontend can query it
      app.manage(BackendPort(port));

      // Spawn the Express backend sidecar (binaries/gitx-backend)
      #[cfg(not(mobile))]
      {
        let shell = app.shell();
        match shell.sidecar("binaries/gitx-backend") {
          Ok(sidecar) => {
            // Pass the port to the sidecar
            let sidecar_with_args = sidecar.args(["--port", &port.to_string()]);
            match sidecar_with_args.spawn() {
              Ok(_) => println!("Successfully spawned backend sidecar on port {}", port),
              Err(e) => eprintln!("Failed to spawn backend sidecar: {}", e),
            }
          }
          Err(e) => eprintln!("Failed to find sidecar 'gitx-backend': {}", e),
        }
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_backend_port])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
