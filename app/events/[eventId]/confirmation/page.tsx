"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, CalendarCheck, Loader2, AlertCircle, Info } from "lucide-react"

interface AttendanceData {
  reg_no: string;
  name?: string;
  timestamp: string;
  event_title?: string;
  event_date?: string;
  event_location?: string;
  selfie_url?: string;
  alreadyPresent?: boolean;
  message?: string;
  attendee_info?: any;
}

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'registered' | 'already_present' | 'error'>('error')
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const registrationData = localStorage.getItem('registrationData')
    const reg_no = searchParams.get('reg_no') || localStorage.getItem('user_reg_no')

    if (registrationData && reg_no) {
      try {
        const parsedData = JSON.parse(registrationData)
        console.log("Parsed registration data:", parsedData)
        
        if (parsedData.success || parsedData.status === 'success') {
          if (parsedData.alreadyPresent) {
            setStatus('already_present')
            setMessage("You have already registered for this event!")
          } else {
            setStatus('registered')
            setMessage("Attendance Marked Successfully! Thank you for registering.")
          }
          
          setAttendanceData({
            reg_no: reg_no,
            timestamp: parsedData.attendee_info?.timestamp || new Date().toISOString(),
            name: parsedData.attendee_info?.name,
            ...parsedData
          })
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

  const getStatusIcon = () => {
    switch (status) {
      case 'registered':
        return (
          <div className="rounded-full bg-green-100 p-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        )
      case 'already_present':
        return (
          <div className="rounded-full bg-blue-100 p-6">
            <Info className="h-12 w-12 text-blue-600" />
          </div>
        )
      default:
        return (
          <div className="rounded-full bg-red-100 p-6">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        )
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'registered':
        return "Attendance Confirmed!"
      case 'already_present':
        return "Already Registered"
      default:
        return "Verification Failed"
    }
  }

  return (
    <div className="container max-w-md py-12 px-4">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl mb-2">
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {(status === 'registered' || status === 'already_present') && attendanceData && (
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
                  {attendanceData.name && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{attendanceData.name}</span>
                    </div>
                  )}
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

              {status === 'already_present' && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
                  <p className="text-blue-800">
                    Your attendance was already recorded for this event. No further action is required.
                  </p>
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