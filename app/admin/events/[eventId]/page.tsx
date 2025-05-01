"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Download, ArrowLeft, Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Mock data - would be fetched from API in a real app
const mockEvent = {
  id: "1",
  title: "Annual Conference 2023",
  description: "The annual tech conference with industry leaders and innovative workshops.",
  startTime: new Date(Date.now() + 3600000).toISOString(),
  endTime: new Date(Date.now() + 7200000).toISOString(),
  location: "Main Hall, Conference Center",
  attendees: [
    {
      id: "a1",
      name: "John Doe",
      registrationNumber: "REG001",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      location: "Main Entrance",
    },
    {
      id: "a2",
      name: "Jane Smith",
      registrationNumber: "REG002",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      location: "South Wing",
    },
    {
      id: "a3",
      name: "Robert Johnson",
      registrationNumber: "REG003",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      location: "Conference Room A",
    },
  ],
}

export default function EventDetails({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    // Simulate API fetch
    setTimeout(() => {
      setEvent(mockEvent)
      setLoading(false)
    }, 1000)
  }, [router, params.eventId])

  const handleDownloadAttendance = () => {
    // In a real app, this would trigger a download of attendance data
    toast({
      title: "Download Started",
      description: "Attendance data is being downloaded",
    })
  }

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
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-muted-foreground mt-2">{event.description}</p>
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
                <div className="font-medium">{new Date(event.startTime).toLocaleDateString()}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                  {new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
              <div className="font-medium">{event.location}</div>
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
              <div className="font-medium">{event.attendees.length} registered</div>
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
          {event.attendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No attendees have registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Registration No.</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {event.attendees.map((attendee: any) => (
                    <tr key={attendee.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{attendee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono">{attendee.registrationNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>{attendee.location}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(attendee.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
