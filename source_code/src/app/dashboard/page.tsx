"use client"

import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { ProviderDashboard } from "@/components/provider-dashboard"
import { ClientDashboard } from "@/components/client-dashboard"
import { Button } from "@/components/ui/button"
import { LogOut, User, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-gaurd"
import { motion } from "framer-motion"
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"

function DashboardContent() {
  const { userProfile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (!userProfile) return null

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-300 opacity-30 dark:opacity-20 blur-3xl animate-pulse-slow z-0" />
      <div className="absolute top-60 right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-300 opacity-30 dark:opacity-20 blur-3xl animate-pulse-slow z-0" />

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md border-b border-gray-200 dark:border-gray-800 relative z-30 sticky top-0 w-full"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-row items-center justify-between h-auto gap-2 py-2 w-full">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none">ServiceSuite</h1>
              <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {userProfile.role === "provider" ? "Service Provider" : "Client"}
              </Badge>
            </div>
            <div className="flex flex-1" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-auto">
              {/* Hamburger menu for user actions on mobile, full user bar on desktop */}
              <div className="relative w-full sm:w-auto flex justify-end">
                {/* Mobile: Hamburger menu */}
                <div className="block sm:hidden">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="Open menu">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-xs w-full">
                      <div className="flex flex-col gap-0">
                         <DialogTitle className="px-4 pt-4 pb-2 text-center text-lg font-bold text-white bg-gradient-to-br from-indigo-600 to-purple-700 rounded-t-md">Your Account</DialogTitle>
                         {/* Modern header with avatar, name, email */}
                         <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-t-none">
                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-2">
                             {userProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                           </div>
                           <span className="font-semibold text-white text-lg mb-1">{userProfile.name}</span>
                           <span className="text-indigo-100 text-xs break-all">{userProfile.email}</span>
                         </div>
                         <div className="border-t border-gray-200 dark:border-gray-700 my-0" />
                         <div className="flex flex-col gap-4 p-6">
                           <Button
                             variant="destructive"
                             className="w-full text-base py-3 font-semibold"
                             onClick={handleLogout}
                             aria-label="Logout"
                           >
                             <LogOut className="h-5 w-5 mr-2" /> Logout
                           </Button>
                         </div>
                         <div className="flex justify-center pb-4">
                           <ModeToggle />
                         </div>
                       </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {/* Desktop: Avatar triggers dialog */}
                <div className="hidden sm:flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {userProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-xs w-full">
                      <div className="flex flex-col gap-0">
                         <DialogTitle className="px-4 pt-4 pb-2 text-center text-lg font-bold text-white bg-gradient-to-br from-indigo-600 to-purple-700 rounded-t-md">Your Account</DialogTitle>
                         {/* Modern header with avatar, name, email */}
                         <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-t-none">
                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-2">
                             {userProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                           </div>
                           <span className="font-semibold text-white text-lg mb-1">{userProfile.name}</span>
                           <span className="text-indigo-100 text-xs break-all">{userProfile.email}</span>
                         </div>
                         <div className="border-t border-gray-200 dark:border-gray-700 my-0" />
                         <div className="flex flex-col gap-4 p-6">
                           <Button
                             variant="destructive"
                             className="w-full text-base py-3 font-semibold"
                             onClick={handleLogout}
                             aria-label="Logout"
                           >
                             <LogOut className="h-5 w-5 mr-2" /> Logout
                           </Button>
                         </div>
                         <div className="flex justify-center pb-4">
                           <ModeToggle />
                         </div>
                       </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {userProfile.role === "provider" ? <ProviderDashboard /> : <ClientDashboard />}
      </motion.main>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && user) {
  //     router.push("/dashboard");
  //   }
  // }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardContent />
    </AuthGuard>
  )
}
