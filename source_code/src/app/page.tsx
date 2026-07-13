"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, Briefcase, ArrowRight, CheckCircle, Menu } from "lucide-react"
import { ModeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { Typewriter } from "react-simple-typewriter"
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"

export default function HomePage() {
    const [showSubtext, setShowSubtext] = useState(false)

    useEffect(() => {
      const timer = setTimeout(() => setShowSubtext(true), 3500) 
      return () => clearTimeout(timer)
    }, [])
    
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-colors overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/3 left-2/3 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      </div>

      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <nav className="container mx-auto flex items-center justify-between gap-2 px-2 sm:px-4 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none">ServiceSuite</h1>
            <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">Beta</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <div className="block sm:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 max-w-xs w-full">
                  <DialogTitle className="px-4 pt-4 pb-2">Welcome to ServiceSuite</DialogTitle>
                  <div className="flex flex-col gap-4 p-6">
                    <Link href="/auth/signin">
                      <Button variant="outline" className="w-full text-base py-3" aria-label="Sign In">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="w-full text-base py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600" aria-label="Get Started">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/signin">
                <Button variant="outline" className="border-gray-200 dark:border-gray-700" aria-label="Sign In">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600" aria-label="Get Started">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <motion.section
        className="relative z-10 container mx-auto px-4 py-20 text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1
          className="text-5xl font-bold text-gray-900 dark:text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          The Ultimate Platform for{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            <Typewriter
              words={["Student Entrepreneurs"]}
              loop={1}
              cursor
              cursorStyle="_"
              typeSpeed={70}
              deleteSpeed={30}
              delaySpeed={700}
            />
          </span>
        </motion.h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect talented student creators with clients who need their services. Build your portfolio, grow your
            business, and achieve your entrepreneurial dreams.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="text-lg px-8 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need to Succeed</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Whether you're a service provider or looking to hire talent, ServiceSuite has the tools to help you thrive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[{
            Icon: Sparkles,
            title: "AI-Powered Taskboard",
            description: "Generate detailed project tasks automatically using advanced AI",
            features: ["Smart task generation", "Priority and time estimation", "Progress tracking"]
          }, {
            Icon: Users,
            title: "Dual User System",
            description: "Separate dashboards for service providers and clients",
            features: ["Provider dashboard", "Client marketplace", "Role-based features"]
          }, {
            Icon: Briefcase,
            title: "Project Management",
            description: "Keep track of all your projects and deadlines in one place",
            features: ["Deadline tracking", "Client communication", "Revenue analytics"]
          }].map(({ Icon, title, description, features }, i) => (
            <motion.div
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="cursor-pointer"
            >

              <Card className="hover:shadow-xl transition-shadow border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                  <Icon className="h-12 w-12 mb-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-gray-900 dark:text-white">{title}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          ))}
        </div>
      </section>

      <motion.section
        className="relative z-10 container mx-auto px-2 sm:px-4 py-12 sm:py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0.8 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 dark:from-indigo-700 dark:via-purple-800 dark:to-indigo-900 shadow-2xl rounded-3xl p-6 sm:p-12 text-center text-white mx-auto max-w-3xl"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 drop-shadow-lg">Ready to Launch Your Solo Career?</h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of student entrepreneurs who are already building their future with <span className="font-bold text-white">ServiceSuite</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-lg px-8 py-3 bg-white text-indigo-600 hover:bg-gray-100 shadow-lg"
              >
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#faq" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto text-lg px-8 py-3 border-white/30 text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.section>

      <footer className="relative z-10 container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <p>2025 ServiceSuite. Built for student entrepreneurs, by student entrepreneurs.</p>
        </div>
      </footer>
    </div>
  )
}
