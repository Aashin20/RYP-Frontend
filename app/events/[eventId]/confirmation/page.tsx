// confirmation.tsx
"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, CalendarCheck, Loader2, AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react"

interface AttendanceData {
  reg_no: string;
  name?: string;
  timestamp: string;
  event_title?: string;
  event_date?: string;
  event_location?: string;
  selfie_url?: string;
  error_code?: number;
  error_type?: string;
}

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'registered' | 'error'>('loading')
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [message, setMessage] = useState("")
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    description: string;
    action?: string;
  } | null>(null)

  useEffect(() => {
    const processRegistrationData = () => {
      const registrationData = localStorage.getItem('registrationData')
      const reg_no = searchParams.get('reg_no') || localStorage.getItem('user_reg_no')

      if (!registrationData || !reg_no) {
        setStatus('error')
        setErrorDetails({
          title: "No Registration Data",
          description: "No registration data found. Please complete the registration process.",
          action: "Register Again"
        })
        return
      }

      try {
        const parsedData = JSON.parse(registrationData)
        
        if (parsedData.success) {
          setStatus('registered')
          setAttendanceData({
            reg_no: reg_no,
            timestamp: new Date().toISOString(),
            ...parsedData
          })
          setMessage(parsedData.message || "Your attendance has been successfully registered!")
        } else {
          setStatus('error')
          // Handle different error types
          const errorType = parsedData.error_type || 'UNKNOWN_ERROR'
          let errorInfo = {
            title: "Registration Failed",
            description: parsedData.message || "Unable to verify attendance.",
            action: "Try Again"
          }

          switch (errorType) {
            case 'FACE_VERIFICATION_FAILED':
              errorInfo = {
                title: "Face Verification Failed",
                description: "We couldn't verify your face with our records. Please ensure good lighting and try again.",
                action: "Retake Photo"
              }
              break
            case 'LOCATION_ERROR':
              errorInfo = {
                title: "Location Error",
                description: "You're too far from the event location. Please ensure you're at the venue.",
                action: "Check Location"
              }
              break
            case 'NETWORK_ERROR':
              errorInfo = {
                title: "Connection Error",
                description: "Please check your internet connection and try again.",
                action: "Retry"
              }
              break
            // Add more error types as needed
          }
          setErrorDetails(errorInfo)
          setMessage(parsedData.message || "Registration failed. Please try again.")
        }
      } catch (error) {
        setStatus('error')
        setErrorDetails({
          title: "Processing Error",
          description: "Unable to process registration data. Please try again.",
          action: "Start Over"
        })
      }
    }

    processRegistrationData()

    // Clean up registration data from localStorage after reading
    return () => {
      localStorage.removeItem('registrationData')
    }
  }, [searchParams])

  const handleRetry = () => {
    router.push(`/register/${params.eventId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    })
  }

  if (status === 'loading') {
    return (
      <div className="container max-w-md py-12 px-4">
        <Card className="text-center">
          <CardContent className="py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Processing registration...</p>
          </CardContent>
        </Card>
      </div>
    )
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
            {status === 'registered' ? "Attendance Confirmed!" : errorDetails?.title}
          </CardTitle>
          <CardDescription className="text-base">
            {status === 'registered' ? message : errorDetails?.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status === 'registered' && attendanceData && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-6">
                <h3 className="font-semibold mb-4">Attendance Details</h3>
                <div className="space-y-3 text-sm">
                  {/* Existing attendance details... */}
                  {attendanceData.event_title && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Event:</span>
                      <span className="font-medium">{attendanceData.event_title}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Faculty ID:</span>
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
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-6">
                <p className="text-destructive mb-4">
                  {errorDetails?.description}
                </p>
                <Button 
                  onClick={handleRetry}
                  className="w-full"
                  variant="destructive"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {errorDetails?.action || "Try Again"}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>If the problem persists, please contact support.</p>
                <p className="mt-1">Reference ID: {params.eventId}</p>
              </div>
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
