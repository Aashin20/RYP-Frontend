// app/admin/events/[eventId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Download, ArrowLeft, Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Attendee {
  reg_no: string;
  name: string;
  timestamp?: string;
}

interface Event {
  _id: string;
  event_name: string;
  event_desc: string;
  event_location: {
    type: string;
    coordinates: number[];
  };
  event_sdate: string;
  event_stime: string;
  event_edate: string;
  event_etime: string;
  attendees: Attendee[];
}

interface PageProps {
  params: {
    eventId: string;
  };
}

export default function EventDetails({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Handle mounting state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle authentication and data fetching
  useEffect(() => {
    if (!mounted) return;

    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"
    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/event/${params.eventId}`)
        if (!response.ok) throw new Error('Event not found')
        const data = await response.json()
        setEvent(data)
      } catch (error) {
        console.error('Failed to fetch event details:', error)
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEventDetails()
  }, [mounted, params.eventId, router, toast])

  // Handle download
  const handleDownloadAttendance = async () => {
    if (!mounted || !params.eventId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/event/${params.eventId}/attendance/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${params.eventId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download Started",
        description: "Attendance data is being downloaded",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download attendance data",
        variant: "destructive",
      })
    }
  }

  // Don't render anything until mounted
  if (!mounted) return null;

  if (loading) {
    return (
      <div className="container py-8 px-4 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-8 px-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>The event you're looking for doesn't exist or has been removed</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/admin/dashboard">Return to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{event.event_name}</h1>
        <p className="text-muted-foreground mt-2">{event.event_desc}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div>
                <div className="font-medium">{event.event_sdate}</div>
                <div className="text-sm text-muted-foreground">
                  {event.event_stime?.slice(0, 5)} - {event.event_etime?.slice(0, 5)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div className="font-medium">
                {`${event.event_location?.coordinates[1].toFixed(6)}, ${event.event_location?.coordinates[0].toFixed(6)}`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start">
              <Users className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div className="font-medium">{event.attendees?.length || 0} registered</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance List</CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadAttendance}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <CardDescription>List of all attendees who registered for this event</CardDescription>
        </CardHeader>
        <CardContent>
          {!event.attendees || event.attendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No attendees have registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Registration No.</th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {event.attendees.map((attendee: Attendee) => (
                    <tr key={attendee.reg_no} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{attendee.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <span>{attendee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono">{attendee.reg_no}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        {attendee.timestamp ? new Date(attendee.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}