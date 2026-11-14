// La aplicación de escritorio solo envuelve la interfaz web (dist/): no expone comandos
// nativos ni plugins. Toda la lógica vive en React y en Supabase, igual que en la versión web.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar la aplicación");
}
