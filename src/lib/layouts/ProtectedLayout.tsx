import SidebarAuth from '@/components/layout/SidebarAuth'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAuth perfil="admin" nome="Ronny Vegas" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0">
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 fade-in">{children}</main>
      </div>
    </div>
  )
}
