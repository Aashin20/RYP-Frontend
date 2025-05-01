"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, Clock, MapPin, ArrowLeft } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

async function latLngToAddress(lat: number, lng: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    )
    const data = await resp.json()
    return data.display_name || `${lat},${lng}`
  } catch {
    return `${lat},${lng}`
  }
}

type ApiEvent = {
  _id : string
  event_name: string
  event_desc?: string
  event_location?: { type: string, coordinates: [number, number] } // GeoJSON
  event_sdate?: string
  event_stime?: string
  event_edate?: string
  event_etime?: string
  attendees_count?: number
}

type DisplayEvent = {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<DisplayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/available_events`)
        const data = await res.json()
        const apiEvents: ApiEvent[] = data.events

        // For each event, fetch address for coordinates if present.
        const displayEvents = await Promise.all(apiEvents.map(async (apiEvent, idx) => {
          let address = "Unknown Location"
          if (
            apiEvent.event_location &&
            apiEvent.event_location.type === "Point" &&
            Array.isArray(apiEvent.event_location.coordinates)
          ) {
            // coordinates: [lng, lat]
            const [lng, lat] = apiEvent.event_location.coordinates
            address = await latLngToAddress(lat, lng)
          }
          return {
            id: apiEvent._id,
            title: apiEvent.event_name,
            description: apiEvent.event_desc || "",
            startTime: apiEvent.event_sdate && apiEvent.event_stime
              ? `${apiEvent.event_sdate}T${apiEvent.event_stime}`
              : "",
            endTime: apiEvent.event_edate && apiEvent.event_etime
              ? `${apiEvent.event_edate}T${apiEvent.event_etime}`
              : "",
            location: address,
          }
        }))
        setEvents(displayEvents)
      } catch (err) {
        setEvents([])
      }
      setLoading(false)
    }
    fetchEvents()
    // Only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectEvent = (eventId: string) => {
    router.push(`/events/${eventId}/register`)
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Available Events</h1>
        <p className="text-muted-foreground mt-2">Select an event to register your attendance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {loading
          ? Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          : events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(new Date(event.startTime))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                      {new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelectEvent(event.id)}
                    className="w-full"
                    disabled={!!event.endTime && new Date(event.endTime) < new Date()}
                  >
                    {!!event.endTime && new Date(event.endTime) < new Date()
                      ? "Event Ended"
                      : "Register Attendance"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}