"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation' // Add this import
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, CalendarCheck, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

interface AttendanceData {
  reg_no: string;
  name: string;
  timestamp: string;
  event_title?: string;
  event_date?: string;
  event_location?: string;
}

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'registered' | 'pending' | 'error'>('loading')
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [message, setMessage] = useState("")
  const [pollingCount, setPollingCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Get registration number from URL params first, then localStorage
    const reg_no = searchParams.get('reg_no') || localStorage.getItem('user_reg_no')
    
    if (!reg_no) {
      setStatus('error')
      setMessage("User registration number not found. Please try registering again.")
      return
    }

    const checkAttendanceStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/attendance_status/${params.eventId}/${reg_no}`)
        
        if (!response.ok) {
          throw new Error(response.status === 404 
            ? "Event or attendance record not found" 
            : "Failed to fetch attendance status"
          )
        }
        
        const data = await response.json()
        
        switch (data.status) {
          case "registered":
            setStatus('registered')
            setAttendanceData({
              reg_no: data.data.reg_no,
              name: data.data.name,
              timestamp: data.data.timestamp,
              event_title: data.data.event_title,
              event_date: data.data.event_date,
              event_location: data.data.event_location
            })
            setMessage(data.message || "Your attendance has been successfully registered!")
            break

          case "pending":
            setStatus('pending')
            setMessage(data.message || "Your attendance is being processed...")
            
            if (pollingCount > 5) {
              toast({
                title: "Still Processing",
                description: "Attendance verification is taking longer than expected. Please wait.",
                variant: "default"
              })
            }
            setPollingCount(prev => prev + 1)
            break

          default:
            throw new Error("Invalid status received")
        }
      } catch (error) {
        console.error("Error checking attendance status:", error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : "Failed to check attendance status")
      }
    }

    checkAttendanceStatus()
    
    // Polling logic
    const intervalId = setInterval(() => {
      if ((status === 'loading' || status === 'pending') && pollingCount < 10) {
        checkAttendanceStatus()
      } else {
        clearInterval(intervalId)
        if (status === 'pending') {
          setMessage("Verification is taking longer than expected. Please check your events page later.")
        }
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [params.eventId, status, pollingCount, searchParams, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    })
  }

  return (
    <div className="container max-w-md py-12 px-4">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="rounded-full bg-blue-100 p-6">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'registered' && (
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            )}
            {status === 'pending' && (
              <div className="rounded-full bg-yellow-100 p-6">
                <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-full bg-red-100 p-6">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl mb-2">
            {status === 'loading' && "Verifying Attendance..."}
            {status === 'registered' && "Attendance Confirmed!"}
            {status === 'pending' && "Processing Attendance"}
            {status === 'error' && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status === 'registered' && attendanceData && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-6">
                <h3 className="font-semibold mb-4">Attendance Details</h3>
                <div className="space-y-3 text-sm">
                  {attendanceData.event_title && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Event:</span>
                      <span className="font-medium">{attendanceData.event_title}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{attendanceData.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Registration No:</span>
                    <span className="font-medium">{attendanceData.reg_no}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Marked At:</span>
                    <span className="font-medium">{formatDate(attendanceData.timestamp)}</span>
                  </div>
                  {attendanceData.event_location && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{attendanceData.event_location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {status === 'pending' && (
            <div className="rounded-lg bg-muted p-6">
              <p className="text-muted-foreground">
                Please wait while we verify your attendance details. This usually takes a few moments.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-lg bg-destructive/10 p-6">
              <p className="text-destructive">
                Unable to verify attendance. Please try registering again or contact support if the issue persists.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/events">
              <CalendarCheck className="h-4 w-4 mr-2" />
              Events
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
