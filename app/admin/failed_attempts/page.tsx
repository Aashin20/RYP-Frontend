"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Check, X, MapPin, Clock, AlertTriangle, User, Camera, Navigation } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL, apiRequest } from "@/lib/api"

interface FailedAttempt {
  attempt_id: string
  reg_no: string
  name: string
  timestamp: string
  reason: string
  selfie_data?: string
  face_encoding?: number[]
  user_location: {
    lat: number
    lng: number
  }
  distance_from_event: number
  face_distance?: number
  event_id?: string
  event_name?: string
}

interface Event {
  _id: string
  event_name: string
  event_sdate: string
  event_stime: string
  attendees_count?: number
}

const reasonLabels = {
  "No face detected in selfie": "No Face Detected",
  "No matching registration found in database": "Registration Not Found", 
  "Face verification failed": "Face Not Recognized",
  "outside_perimeter": "Outside Event Perimeter",
  "poor_image_quality": "Poor Image Quality",
  "duplicate_attempt": "Duplicate Attempt",
}

const reasonColors = {
  "No face detected in selfie": "destructive" as const,
  "No matching registration found in database": "secondary" as const,
  "Face verification failed": "destructive" as const,
  "outside_perimeter": "secondary" as const,
  "poor_image_quality": "outline" as const,
  "duplicate_attempt": "default" as const,
}

export default function FailedAttemptsPage() {
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [processingAttempt, setProcessingAttempt] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load events first
      const eventsResponse = await apiRequest(`${API_BASE_URL}/active_events`)
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.events || [])
      }

      // Load failed attempts for all events
      const allFailedAttempts: FailedAttempt[] = []
      
      if (selectedEvent === "all") {
        // Get failed attempts for all events
        const pastEventsResponse = await apiRequest(`${API_BASE_URL}/past_events`)
        const activeEventsResponse = await apiRequest(`${API_BASE_URL}/active_events`)
        
        let allEvents: Event[] = []
        if (pastEventsResponse.ok) {
          const pastData = await pastEventsResponse.json()
          allEvents = [...allEvents, ...pastData.events]
        }
        if (activeEventsResponse.ok) {
          const activeData = await activeEventsResponse.json()
          allEvents = [...allEvents, ...activeData.events]
        }

        for (const event of allEvents) {
          try {
            const failedResponse = await apiRequest(`${API_BASE_URL}/event/${event._id}/failed_attempts`)
            if (failedResponse.ok) {
              const failedData = await failedResponse.json()
              const attempts = failedData.failed_attempts || []
              // Add event info to each attempt
              const attemptsWithEventInfo = attempts.map((attempt: FailedAttempt) => ({
                ...attempt,
                event_id: event._id,
                event_name: event.event_name
              }))
              allFailedAttempts.push(...attemptsWithEventInfo)
            }
          } catch (error) {
            console.error(`Error loading failed attempts for event ${event._id}:`, error)
          }
        }
      } else {
        // Get failed attempts for specific event
        const failedResponse = await apiRequest(`${API_BASE_URL}/event/${selectedEvent}/failed_attempts`)
        if (failedResponse.ok) {
          const failedData = await failedResponse.json()
          const attempts = failedData.failed_attempts || []
          const attemptsWithEventInfo = attempts.map((attempt: FailedAttempt) => ({
            ...attempt,
            event_id: selectedEvent,
            event_name: failedData.event_name
          }))
          allFailedAttempts.push(...attemptsWithEventInfo)
        }
      }

      setFailedAttempts(allFailedAttempts)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load failed attempts data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Reload data when selectedEvent changes
  useEffect(() => {
    if (!loading) {
      loadData()
    }
  }, [selectedEvent])

  const handleApprove = async (attemptId: string, eventId: string) => {
    try {
      setProcessingAttempt(attemptId)
      
      const formData = new FormData()
      formData.append('event_id', eventId)
      formData.append('failed_attempt_id', attemptId)

      const response = await apiRequest(`${API_BASE_URL}/admin/approve_attendance`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        
        // Remove the approved attempt from the list
        setFailedAttempts((attempts) => 
          attempts.filter((attempt) => attempt.attempt_id !== attemptId)
        )
        
        toast({
          title: "Attendance Approved",
          description: "The attendance attempt has been approved and recorded",
        })
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to approve attendance')
      }
    } catch (error) {
      console.error('Error approving attendance:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve attendance",
        variant: "destructive",
      })
    } finally {
      setProcessingAttempt(null)
    }
  }

  const handleDecline = async (attemptId: string) => {
    try {
      setProcessingAttempt(attemptId)
      
      // For now, just remove from local state since there's no decline endpoint
      // You might want to add a decline endpoint to your backend
      setFailedAttempts((attempts) =>
        attempts.filter((attempt) => attempt.attempt_id !== attemptId)
      )
      
      toast({
        title: "Attempt Declined",
        description: "The attendance attempt has been declined",
        variant: "destructive",
      })
    } catch (error) {
      console.error('Error declining attendance:', error)
      toast({
        title: "Error", 
        description: "Failed to decline attendance",
        variant: "destructive",
      })
    } finally {
      setProcessingAttempt(null)
    }
  }

  const filteredAttempts = selectedEvent === "all" 
    ? failedAttempts 
    : failedAttempts.filter((attempt) => attempt.event_id === selectedEvent)

  const getReasonLabel = (reason: string) => {
    // Handle dynamic reasons like "Face verification failed (distance: 0.xxx)"
    if (reason.startsWith("Face verification failed")) {
      return "Face Not Recognized"
    }
    return reasonLabels[reason as keyof typeof reasonLabels] || reason
  }

  const getReasonColor = (reason: string) => {
    if (reason.startsWith("Face verification failed")) {
      return "destructive" as const
    }
    return reasonColors[reason as keyof typeof reasonColors] || "default" as const
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getLocationAddress = (lat: number, lng: number) => {
    // You might want to implement reverse geocoding here
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  const viewImage = (imageData: string) => {
    if (imageData) {
      const imageUrl = `data:image/jpeg;base64,${imageData}`
      window.open(imageUrl, '_blank')
    }
  }

  return (
    <div className="container py-8 px-4">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/admin/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Failed Attendance Attempts</h1>
          <p className="text-muted-foreground">Review and manage failed attendance registrations</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAttempts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Face Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredAttempts.filter(a => 
                a.reason.includes("Face verification failed") || 
                a.reason.includes("No face detected")
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registration Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredAttempts.filter(a => 
                a.reason.includes("No matching registration found")
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Location Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredAttempts.filter(a => a.distance_from_event > 100).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event._id} value={event._id}>
                  {event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Failed Attempts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading failed attempts...</p>
            </div>
          </div>
        ) : filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No failed attempts found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAttempts.map((attempt) => (
            <Card key={attempt.attempt_id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* User Image and Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {attempt.selfie_data ? (
                          <AvatarImage 
                            src={`data:image/jpeg;base64,${attempt.selfie_data}`} 
                            alt="User selfie" 
                          />
                        ) : (
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{attempt.event_name || 'Unknown Event'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Reg No: {attempt.reg_no}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Name: {attempt.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(attempt.timestamp)}
                        </p>
                        <Badge variant={getReasonColor(attempt.reason)} className="mt-1">
                          {getReasonLabel(attempt.reason)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Attempt Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Location</p>
                        <p className="text-muted-foreground">
                          {getLocationAddress(attempt.user_location.lat, attempt.user_location.lng)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Distance: {attempt.distance_from_event.toFixed(0)}m from event
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Failure Reason</p>
                        <p className="text-muted-foreground">{attempt.reason}</p>
                        {attempt.face_distance && (
                          <p className="text-xs text-muted-foreground">
                            Face distance: {attempt.face_distance.toFixed(3)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Status</p>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => attempt.event_id ? handleApprove(attempt.attempt_id, attempt.event_id) : null}
                      className="w-full" 
                      size="sm"
                      disabled={processingAttempt === attempt.attempt_id || !attempt.event_id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processingAttempt === attempt.attempt_id ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleDecline(attempt.attempt_id)}
                      variant="destructive"
                      className="w-full"
                      size="sm"
                      disabled={processingAttempt === attempt.attempt_id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    {attempt.selfie_data && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-transparent"
                        onClick={() => viewImage(attempt.selfie_data!)}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        View Full Image
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}