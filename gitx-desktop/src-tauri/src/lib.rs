use tauri_plugin_shell::ShellExt;

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

      // Spawn the Express backend sidecar (gitx-backend)
      #[cfg(not(mobile))]
      {
        let shell = app.shell();
        match shell.sidecar("gitx-backend") {
          Ok(sidecar) => {
            match sidecar.spawn() {
              Ok(_) => println!("Successfully spawned backend sidecar"),
              Err(e) => eprintln!("Failed to spawn backend sidecar: {}", e),
            }
          }
          Err(e) => eprintln!("Failed to find sidecar 'gitx-backend': {}", e),
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
