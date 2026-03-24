import { Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-sabc-gray-50 flex flex-col items-center justify-center p-6 md:p-10">
      <Outlet />
    </div>
  )
}
