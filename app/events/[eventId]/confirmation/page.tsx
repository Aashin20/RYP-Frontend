// confirmation.tsx
"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, CalendarCheck, Loader2, AlertCircle } from "lucide-react"

interface AttendanceData {
  reg_no: string;
  name?: string;
  timestamp: string;
  event_title?: string;
  event_date?: string;
  event_location?: string;
  selfie_url?: string;
}

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'registered' | 'error'>('error')
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Get registration data from localStorage
    const registrationData = localStorage.getItem('registrationData')
    const reg_no = searchParams.get('reg_no') || localStorage.getItem('user_reg_no')

    if (registrationData && reg_no) {
      try {
        const parsedData = JSON.parse(registrationData)
        
        if (parsedData.success) {
          setStatus('registered')
          setAttendanceData({
            reg_no: reg_no,
            timestamp: new Date().toISOString(),
            ...parsedData
          })
          setMessage("Your attendance has been successfully registered!")
        } else {
          setStatus('error')
          setMessage(parsedData.message || "Registration failed. Please try again.")
        }
      } catch (error) {
        setStatus('error')
        setMessage("Unable to verify registration. Please try again.")
      }
    } else {
      setStatus('error')
      setMessage("No registration data found. Please complete the registration process.")
    }

    // Clean up registration data from localStorage after reading
    return () => {
      localStorage.removeItem('registrationData')
    }
  }, [searchParams])

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
            {status === 'registered' ? (
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-6">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl mb-2">
            {status === 'registered' ? "Attendance Confirmed!" : "Verification Failed"}
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
              
              {attendanceData.selfie_url && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={attendanceData.selfie_url} 
                    alt="Attendance Selfie" 
                    className="w-full h-auto"
                  />
                </div>
              )}
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
