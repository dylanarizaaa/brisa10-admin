// Evita que se abra una consola adicional en Windows en las versiones de producción. NO QUITAR.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    brisa10_admin_lib::run();
}
