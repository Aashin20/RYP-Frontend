"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Download, LogOut, Calendar, Users, Clock, Database, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL, apiRequest } from "@/lib/api"

interface EventSummary {
  _id: string
  event_name: string
  event_sdate: string
  event_stime: string
  attendees_count: number
}

interface FailedAttemptsSummary {
  count: number
}

export default function AdminDashboard() {
  const [activeEvents, setActiveEvents] = useState<EventSummary[]>([])
  const [pastEvents, setPastEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [faceCount, setFaceCount] = useState(0)
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch active events
      const activeEventsResponse = await apiRequest(`${API_BASE_URL}/active_events`)
      if (activeEventsResponse.ok) {
        const activeEventsData = await activeEventsResponse.json()
        setActiveEvents(activeEventsData.events || [])
      }

      // Fetch past events
      const pastEventsResponse = await apiRequest(`${API_BASE_URL}/past_events`)
      if (pastEventsResponse.ok) {
        const pastEventsData = await pastEventsResponse.json()
        setPastEvents(pastEventsData.events || [])
      }

      // Fetch face count
      const faceCountResponse = await apiRequest(`${API_BASE_URL}/faces/count`)
      if (faceCountResponse.ok) {
        const faceCountData = await faceCountResponse.json()
        setFaceCount(faceCountData.count || 0)
      }

      // Calculate failed attempts count from all active events
      let totalFailedAttempts = 0
      for (const event of activeEvents) {
        try {
          const failedAttemptsResponse = await apiRequest(`${API_BASE_URL}/event/${event._id}/failed_attempts`)
          if (failedAttemptsResponse.ok) {
            const failedAttemptsData = await failedAttemptsResponse.json()
            totalFailedAttempts += failedAttemptsData.count || 0
          }
        } catch (error) {
          console.error(`Error fetching failed attempts for event ${event._id}:`, error)
        }
      }
      setFailedAttemptsCount(totalFailedAttempts)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    router.push("/")
  }

  const handleDownloadAttendance = async (eventId: string) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/event/${eventId}/attendance/download`)
      
      if (!response.ok) {
        throw new Error("Failed to download attendance data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `attendance-${eventId}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: "Attendance data has been downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading attendance:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download attendance data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      // Handle time format from backend
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      })
    } catch {
      return timeString
    }
  }

  const totalEvents = activeEvents.length + pastEvents.length
  const totalAttendees = [...activeEvents, ...pastEvents].reduce((sum, event) => sum + event.attendees_count, 0)

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
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

      <div className="grid gap-6 mb-8 md:grid-cols-5">
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

        <Card className="bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border-orange-200">
          <Link href="/admin/failed-attempts">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                <div className="text-2xl font-bold text-orange-600">{failedAttemptsCount} pending</div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/admin/events/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Event
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/admin/faces">
                <Database className="h-4 w-4 mr-2" />
                Manage Face Database
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/admin/failed-attempts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review Failed Attempts
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Connection</span>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Face Recognition</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Events ({activeEvents.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({pastEvents.length})</TabsTrigger>
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

            {activeEvents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No active events</p>
                <p className="text-sm">Create your first event to get started</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/events/create">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              </div>
            ) : (
              activeEvents.map((event) => (
                <div key={event._id} className="p-4 border-t grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="col-span-5 md:col-span-4">
                    <div className="font-medium">{event.event_name}</div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {formatDate(event.event_sdate)} • {formatTime(event.event_stime)}
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground hidden md:block">
                    {formatDate(event.event_sdate)} • {formatTime(event.event_stime)}
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="font-medium">{event.attendees_count}</span>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadAttendance(event._id)}
                      disabled={event.attendees_count === 0}
                    >
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

            {pastEvents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No past events</p>
                <p className="text-sm">Past events will appear here after they're completed</p>
              </div>
            ) : (
              pastEvents.map((event) => (
                <div key={event._id} className="p-4 border-t grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="col-span-5 md:col-span-4">
                    <div className="font-medium">{event.event_name}</div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {formatDate(event.event_sdate)} • {formatTime(event.event_stime)}
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground hidden md:block">
                    {formatDate(event.event_sdate)} • {formatTime(event.event_stime)}
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="font-medium">{event.attendees_count}</span>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadAttendance(event._id)}
                      disabled={event.attendees_count === 0}
                    >
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