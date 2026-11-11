import { Outlet } from 'react-router'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { UserMenu } from '@/features/auth/components/user-menu'
import { AppSidebar } from './app-sidebar'
import { HeaderSearch } from './header-search'

/** Estructura principal: sidebar de navegación + header + contenido. */
export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <HeaderSearch />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
