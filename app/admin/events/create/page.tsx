"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, MapPin, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { API_BASE_URL, apiRequest } from "@/lib/api"

interface GeoLocation {
  lat: number
  lng: number
}

export default function CreateEvent() {
  const [eventName, setEventName] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [eventLocation, setEventLocation] = useState<GeoLocation | null>(null)
  const [perimeter, setPerimeter] = useState("100")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [manualCoords, setManualCoords] = useState({ lat: "", lng: "" })
  const [useManualCoords, setUseManualCoords] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
    }
  }, [router])

  const getCurrentLocation = () => {
    setGettingLocation(true)
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation. Please enter coordinates manually.",
        variant: "destructive",
      })
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: GeoLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setEventLocation(location)
        setLocationInput(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`)
        toast({
          title: "Location Obtained",
          description: "Current location has been set for the event",
        })
        setGettingLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        let errorMessage = "Failed to get location. Please enter coordinates manually."
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enter coordinates manually."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please enter coordinates manually."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please enter coordinates manually."
            break
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        })
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualCoords.lat)
    const lng = parseFloat(manualCoords.lng)
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive",
      })
      return
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid Coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180",
        variant: "destructive",
      })
      return
    }
    
    const location: GeoLocation = { lat, lng }
    setEventLocation(location)
    setLocationInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    toast({
      title: "Location Set",
      description: "Manual coordinates have been set for the event",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventName || !eventDesc || !eventLocation || !perimeter || !startDate || !startTime || !endDate || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and set the event location",
        variant: "destructive",
      })
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    const perimeterValue = parseInt(perimeter)
    if (isNaN(perimeterValue) || perimeterValue < 1 || perimeterValue > 10000) {
      toast({
        title: "Invalid Perimeter",
        description: "Perimeter must be between 1 and 10000 meters",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const eventData = {
        event_name: eventName,
        event_desc: eventDesc,
        event_location: eventLocation,
        event_sdate: startDate,
        event_stime: startTime,
        event_edate: endDate,
        event_etime: endTime,
        attendees: []
      }

      const response = await apiRequest(`${API_BASE_URL}/create_event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create event')
      }

      const result = await response.json()
      
      if (result.status === "Event already exists") {
        toast({
          title: "Event Exists",
          description: "An event with this name already exists. Please choose a different name.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Event Created",
          description: `Event "${eventName}" has been created successfully with ${perimeterValue}m attendance radius`,
        })
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "There was a problem creating your event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/admin/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>Fill in the details to create a new event with location-based attendance</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDesc">Event Description</Label>
              <Textarea
                id="eventDesc"
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="Enter detailed event description"
                rows={3}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Event Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseManualCoords(!useManualCoords)}
                >
                  {useManualCoords ? "Use GPS" : "Manual Entry"}
                </Button>
              </div>
              
              {!useManualCoords ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="flex-1"
                    >
                      {gettingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Get Current Location
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {eventLocation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Location Set:</span>
                        <span className="font-mono">
                          {eventLocation.lat.toFixed(6)}, {eventLocation.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={manualCoords.lat}
                        onChange={(e) => setManualCoords({...manualCoords, lat: e.target.value})}
                        placeholder="e.g., 13.0827"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={manualCoords.lng}
                        onChange={(e) => setManualCoords({...manualCoords, lng: e.target.value})}
                        placeholder="e.g., 80.2707"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleManualCoordinates}
                    className="w-full"
                    disabled={!manualCoords.lat || !manualCoords.lng}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Set Manual Coordinates
                  </Button>
                  
                  {eventLocation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Location Set:</span>
                        <span className="font-mono">
                          {eventLocation.lat.toFixed(6)}, {eventLocation.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="perimeter">Attendance Radius (meters)</Label>
              <Input
                id="perimeter"
                type="number"
                value={perimeter}
                onChange={(e) => setPerimeter(e.target.value)}
                placeholder="Enter radius in meters"
                min="1"
                max="10000"
                required
              />
              <p className="text-sm text-muted-foreground">
                Users must be within this distance from the event location to mark attendance. 
                <br />
                <strong>Recommended:</strong> 50-200 meters for indoor events, 100-500 meters for outdoor events.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {eventLocation && perimeter && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Event Summary</h4>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Location:</strong> {eventLocation.lat.toFixed(6)}, {eventLocation.lng.toFixed(6)}</p>
                  <p><strong>Attendance Radius:</strong> {perimeter}m from event center</p>
                  <p><strong>Area Coverage:</strong> ~{Math.PI * Math.pow(parseInt(perimeter) / 1000, 2) < 1 
                    ? (Math.PI * Math.pow(parseInt(perimeter), 2) / 10000).toFixed(2) + ' hectares'
                    : (Math.PI * Math.pow(parseInt(perimeter) / 1000, 2)).toFixed(2) + ' km²'
                  }</p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || !eventLocation}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Event...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}