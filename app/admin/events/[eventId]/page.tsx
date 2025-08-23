"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Download, ArrowLeft, Calendar, MapPin, Users, Check, X, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL, apiRequest } from "@/lib/api"

interface EventDetails {
  _id: string
  event_name: string
  event_desc: string
  event_location: {
    type: string
    coordinates: [number, number]
  }
  event_sdate: string
  event_stime: string
  event_edate: string
  event_etime: string
  attendees: Array<{
    reg_no: string
    name: string
    timestamp: string
    intime?: string
    approved_manually?: boolean
    original_attempt_time?: string
  }>
}

interface FailedAttempt {
  attempt_id: string
  reg_no: string
  name: string
  timestamp: string
  reason: string
  selfie_data?: string
  face_encoding?: number[]
  user_location?: {
    lat: number
    lng: number
  }
  distance_from_event?: number
  face_distance?: number
}

interface FailedAttemptsResponse {
  event_name: string
  failed_attempts: FailedAttempt[]
  count: number
}

export default function EventDetails({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    fetchEventDetails()
  }, [router, params.eventId])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch event details
      const eventResponse = await apiRequest(`${API_BASE_URL}/event/${params.eventId}`)
      if (!eventResponse.ok) {
        if (eventResponse.status === 404) {
          setEvent(null)
          setLoading(false)
          return
        }
        throw new Error("Failed to fetch event details")
      }
      
      const eventData = await eventResponse.json()
      setEvent(eventData)

      // Fetch failed attempts
      const failedAttemptsResponse = await apiRequest(`${API_BASE_URL}/event/${params.eventId}/failed_attempts`)
      if (failedAttemptsResponse.ok) {
        const failedAttemptsData: FailedAttemptsResponse = await failedAttemptsResponse.json()
        setFailedAttempts(failedAttemptsData.failed_attempts || [])
      }

    } catch (error) {
      console.error("Error fetching event details:", error)
      toast({
        title: "Error",
        description: "Failed to load event details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAttendance = async () => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/event/${params.eventId}/attendance/download`)
      
      if (!response.ok) {
        throw new Error("Failed to download attendance data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `attendance-${params.eventId}.csv`)
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

  const handleApproveAttendance = async (attemptId: string) => {
    try {
      setApproving(attemptId)
      
      const formData = new FormData()
      formData.append('event_id', params.eventId)
      formData.append('failed_attempt_id', attemptId)

      const response = await apiRequest(`${API_BASE_URL}/admin/approve_attendance`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to approve attendance")
      }

      const result = await response.json()
      
      toast({
        title: "Attendance Approved",
        description: "The attendance has been approved and marked successfully",
      })

      // Refresh the data
      await fetchEventDetails()

    } catch (error) {
      console.error("Error approving attendance:", error)
      toast({
        title: "Approval Failed",
        description: "Failed to approve attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setApproving(null)
    }
  }

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(`${date}T${time}`)
      return {
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    } catch {
      return { date: date, time: time }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return timestamp
    }
  }

  const formatLocation = (location: EventDetails['event_location']) => {
    if (location?.coordinates) {
      const [lng, lat] = location.coordinates
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
    return "Location not specified"
  }

  const getTimeAgo = (timestamp: string) => {
    try {
      const now = new Date()
      const past = new Date(timestamp)
      const diffMs = now.getTime() - past.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else if (diffMins > 0) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      } else {
        return "Just now"
      }
    } catch {
      return "Unknown"
    }
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

  const startDateTime = formatDateTime(event.event_sdate, event.event_stime)
  const endDateTime = formatDateTime(event.event_edate, event.event_etime)

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
                <div className="font-medium">{startDateTime.date}</div>
                <div className="text-sm text-muted-foreground">
                  {startDateTime.time} - {endDateTime.time}
                </div>
                {event.event_sdate !== event.event_edate && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Ends: {endDateTime.date}
                  </div>
                )}
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
              <div className="font-medium text-sm">{formatLocation(event.event_location)}</div>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadAttendance}
              disabled={!event.attendees || event.attendees.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
          <CardDescription>List of all attendees who registered for this event</CardDescription>
        </CardHeader>
        <CardContent>
          {!event.attendees || event.attendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No attendees yet</p>
              <p className="text-sm">Attendees will appear here once they check in</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Registration No.</th>
                    <th className="text-left py-3 px-4">Check-in Time</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {event.attendees.map((attendee, index) => (
                    <tr key={`${attendee.reg_no}-${index}`} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {attendee.name ? attendee.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{attendee.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{attendee.reg_no}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatTimestamp(attendee.intime || attendee.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {attendee.approved_manually ? (
                          <Badge variant="secondary" className="text-xs">
                            Manually Approved
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Auto Verified
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Failed Attendance Attempts
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{failedAttempts.length} pending</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/failed-attempts?event=${params.eventId}`}>View All</Link>
              </Button>
            </div>
          </div>
          <CardDescription>Recent failed attempts for this event that require admin review</CardDescription>
        </CardHeader>
        <CardContent>
          {failedAttempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No failed attempts</p>
              <p className="text-sm">All attendance attempts have been successful</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {failedAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt.attempt_id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <Avatar>
                    <AvatarFallback>
                      {attempt.name && attempt.name !== 'Unknown' ? attempt.name.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{attempt.name}</p>
                      <span className="text-xs text-muted-foreground font-mono">({attempt.reg_no})</span>
                    </div>
                    <p className="text-sm text-red-600 mb-1">{attempt.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{getTimeAgo(attempt.timestamp)}</span>
                      {attempt.distance_from_event && (
                        <span>Distance: {attempt.distance_from_event.toFixed(0)}m</span>
                      )}
                      {attempt.face_distance && (
                        <span>Face confidence: {((1 - attempt.face_distance) * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApproveAttendance(attempt.attempt_id)}
                      disabled={approving === attempt.attempt_id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {approving === attempt.attempt_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {failedAttempts.length > 5 && (
                <div className="text-center pt-4 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/failed-attempts?event=${params.eventId}`}>
                      View all {failedAttempts.length} failed attempts
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}