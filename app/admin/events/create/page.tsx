"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type Coords = { lat: number; lng: number }

export default function CreateEvent() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")       // human address for backend event_address
  const [coords, setCoords] = useState<Coords | null>(null) // event_location for backend
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [locDetection, setLocDetection] = useState<"idle" | "detecting" | "error" | "done">("idle")
  const router = useRouter()
  const { toast } = useToast()

  // Authentication check on mount (client side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"
      if (!isAuthenticated) {
        router.push("/admin/login")
      }
    }
  }, [router])

  // Location detection handler (not auto on mount! Let user trigger)
  const detectLocation = () => {
    setLocDetection("detecting")
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCoords({ lat: latitude, lng: longitude })
          // Reverse geocode
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            )
            const data = await resp.json()
            setAddress(data.display_name || "")
            setLocDetection("done")
          } catch {
            setAddress("")
            setLocDetection("error")
          }
        },
        () => {
          setAddress("")
          setCoords(null)
          setLocDetection("error")
        }
      )
    } else {
      setLocDetection("error")
    }
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !address || !startDate || !startTime || !endDate || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // ISO validation for date/time
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

    if (!coords) {
      toast({
        title: "No Coordinates Detected",
        description: "Click 'Detect Location' to get coordinates for this address.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/create_event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: title,
          event_desc: description,
          event_location: coords,    // { lat, lng }
          event_address: address,    // human address
          event_sdate: startDate,    // string, YYYY-MM-DD
          event_stime: startTime,    // string, HH:mm
          event_edate: endDate,      // string, YYYY-MM-DD
          event_etime: endTime,      // string, HH:mm
          attendees: []              // always an array
        }),
      })

      const result = await response.json()

      if (response.ok && result.status === "Event created successfully") {
        toast({
          title: "Event Created",
          description: "Your event has been created successfully",
        })
        router.push("/admin/dashboard")
      } else {
        throw new Error(result.status || "Unknown error")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Creation Failed",
        description: "There was a problem creating your event. Please try again.",
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
          <CardDescription>Fill in the details to create a new event</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Location Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter event address"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={detectLocation}
                  variant={
                    locDetection === "done"
                      ? "default"
                      : locDetection === "error"
                      ? "destructive"
                      : "outline"
                  }
                  disabled={locDetection === "detecting"}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  {locDetection === "detecting" ? "Detecting..." : "Detect Location"}
                </Button>
              </div>
              {coords && (
                <div className="text-xs text-muted-foreground">
                  <strong>Coordinates:</strong>{" "}
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </div>
              )}
              {locDetection === "error" && (
                <div className="text-xs text-red-600">
                  Could not detect location. Please try again.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
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