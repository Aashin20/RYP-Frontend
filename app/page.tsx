import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin, Camera } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">

      {/* HEADER */}
      <div className="w-full bg-slate-900 text-white text-center py-2 text-sm font-medium">
        Developed by <span className="text-primary font-semibold">Dr. Alice K</span> and Team
      </div>

      <div className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Register Your <span className="text-primary">Presence</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Quickly mark your attendance with facial recognition technology
          </p>

          <div className="mt-12 flex justify-center">
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href="/events">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Select Event</h3>
              <p className="text-muted-foreground">Choose from available events to mark your attendance</p>
            </div>

            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Take a Selfie</h3>
              <p className="text-muted-foreground">Our system will recognize you automatically</p>
            </div>

            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Confirm Location</h3>
              <p className="text-muted-foreground">Your location is automatically detected for verification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 py-12 text-white">
        <div className="container px-4 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to register your presence?</h2>
          <p className="mt-4 text-slate-300">Join events and mark your attendance in just a few simple steps</p>
          <Button asChild size="lg" className="mt-8 rounded-full px-8 text-base">
            <Link href="/events">
              Browse Events
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
