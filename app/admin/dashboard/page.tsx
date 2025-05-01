"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Download, LogOut, Calendar, Users, Clock, Database } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AdminDashboard() {
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [pastEvents, setPastEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [faceCount, setFaceCount] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"
    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    // Fetch active and past events from backend
    Promise.all([
      fetch(`${API_BASE_URL}/active_events`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/past_events`).then((res) => res.json()),
    ])
      .then(([activeData, pastData]) => {
        setActiveEvents(activeData.events || [])
        setPastEvents(pastData.events || [])
        setFaceCount(5) // Or fetch from API if available
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setLoading(false)
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    router.push("/")
  }

  const handleDownloadAttendance = (eventId: string) => {
    toast({
      title: "Download Started",
      description: "Attendance data is being downloaded",
    })
  }

  // For Cards: Use live events
  const totalEvents = activeEvents.length + pastEvents.length
  const totalAttendees = activeEvents.concat(pastEvents).reduce((sum, event) => sum + (event.attendees_count || 0), 0)

  return (
    <div className="container py-8 px-4">
      {/* HEADER and BUTTONS here */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage events and view attendance</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/events/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* EVENT SUMMARY CARDS */}
      <div className="grid gap-6 mb-8 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{totalEvents}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{activeEvents.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{totalAttendees}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
          <Link href="/admin/faces">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Face Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Database className="h-5 w-5 text-primary mr-2" />
                <div className="text-2xl font-bold">{faceCount} faces</div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* QUICK ACTION CARDS */}
      <div className="grid gap-6 mb-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/events/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Event
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/faces">
                <Database className="h-4 w-4 mr-2" />
                Manage Face Database
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* EVENT TABLES */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="rounded-md border">
            <div className="p-4 bg-muted/50">
              <div className="grid grid-cols-12 gap-4 font-medium">
                <div className="col-span-5 md:col-span-4">Event Name</div>
                <div className="col-span-4 md:col-span-3 hidden md:block">Date & Time</div>
                <div className="col-span-3 md:col-span-2">Attendees</div>
                <div className="col-span-4 md:col-span-3 text-right">Actions</div>
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading events...</div>
            ) : activeEvents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No active events found</div>
            ) : (
              activeEvents.map((event) => (
                <div key={event._id || event.event_name} className="p-4 border-t grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 md:col-span-4 font-medium">{event.event_name}</div>
                  <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground hidden md:block">
                    {event.event_sdate} • {event.event_stime.slice(0,5)}
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{event.attendees_count}</span>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadAttendance(event._id)}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Download</span>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/events/${event._id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="rounded-md border">
            <div className="p-4 bg-muted/50">
              <div className="grid grid-cols-12 gap-4 font-medium">
                <div className="col-span-5 md:col-span-4">Event Name</div>
                <div className="col-span-4 md:col-span-3 hidden md:block">Date & Time</div>
                <div className="col-span-3 md:col-span-2">Attendees</div>
                <div className="col-span-4 md:col-span-3 text-right">Actions</div>
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading events...</div>
            ) : pastEvents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No past events found</div>
            ) : (
              pastEvents.map((event) => (
                <div key={event._id || event.event_name} className="p-4 border-t grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 md:col-span-4 font-medium">{event.event_name}</div>
                  <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground hidden md:block">
                    {event.event_sdate} • {event.event_stime.slice(0,5)}
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{event.attendees_count}</span>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadAttendance(event._id)}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Download</span>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/events/${event._id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}