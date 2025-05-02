"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, CalendarCheck, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Use fallback if environment variable is not set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001"

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const [status, setStatus] = useState<'loading' | 'registered' | 'pending' | 'error'>('loading')
  const [userData, setUserData] = useState<{
    reg_no?: string;
    name?: string;
    timestamp?: string;
  } | null>(null)
  const [message, setMessage] = useState("")
  const [pollingCount, setPollingCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Get registration number from localStorage (set during login/registration)
    const reg_no = localStorage.getItem('user_reg_no')
    
    if (!reg_no) {
      setStatus('error')
      setMessage("User registration number not found. Please log in again.")
      return
    }

    const checkAttendanceStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/attendance_status/${params.eventId}/${reg_no}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setStatus('error')
            setMessage("Event not found. Please check the event ID.")
            return
          }
          throw new Error("Failed to fetch attendance status")
        }
        
        const data = await response.json()
        
        if (data.status === "registered") {
          setStatus('registered')
          setUserData({
            reg_no: data.data.reg_no,
            name: data.data.name,
            timestamp: data.data.timestamp
          })
          setMessage(data.message)
        } else if (data.status === "pending") {
          setStatus('pending')
          setMessage(data.message)
          
          // If we're still pending after multiple polls, inform the user
          if (pollingCount > 5) {
            setMessage("Your attendance is still being processed. This may take a few moments.")
            toast({
              title: "Processing",
              description: "Attendance verification is taking longer than expected. Please wait.",
              variant: "default"
            })
          }
          
          // Continue polling if status is pending
          setPollingCount(prev => prev + 1)
        }
      } catch (error) {
        console.error("Error checking attendance status:", error)
        setStatus('error')
        setMessage("Failed to check attendance status. Please try again later.")
      }
    }

    checkAttendanceStatus()
    
    // Set up polling if status is still loading or pending
    // Poll every 3 seconds up to a maximum of 30 seconds (10 attempts)
    const intervalId = setInterval(() => {
      if (status === 'loading' || status === 'pending') {
        if (pollingCount < 10) {
          checkAttendanceStatus()
        } else {
          clearInterval(intervalId)
          if (status === 'pending') {
            setMessage("Your attendance is still being processed. Please check your events page later.")
          }
        }
      } else {
        clearInterval(intervalId)
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [params.eventId, status, pollingCount, toast])

  return (
    <div className="container max-w-md py-12 px-4">
      <Card className="text-center border-none shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
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
          <CardTitle className="text-2xl">
            {status === 'loading' && "Checking Attendance..."}
            {status === 'registered' && "Attendance Registered!"}
            {status === 'pending' && "Processing Attendance"}
            {status === 'error' && "Attendance Check Failed"}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {status === 'registered' && userData && (
            <div className="rounded-lg bg-muted p-4 mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-left text-muted-foreground">Name:</div>
                <div className="text-right font-medium">{userData.name}</div>
                
                <div className="text-left text-muted-foreground">Registration No:</div>
                <div className="text-right font-medium">{userData.reg_no}</div>
                
                <div className="text-left text-muted-foreground">Time:</div>
                <div className="text-right font-medium">
                  {userData.timestamp ? new Date(userData.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          )}
          
          {status === 'pending' && (
            <div className="rounded-lg bg-muted p-4 mb-6">
              <p className="text-muted-foreground">
                Your facial recognition and location data are being verified. 
                This may take a few moments to complete.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-lg bg-red-50 p-4 mb-6">
              <p className="text-red-600">
                There was a problem verifying your attendance. 
                Please try registering again or contact support.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4 pt-0">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/events">
              <CalendarCheck className="h-4 w-4 mr-2" />
              More Events
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
