"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const name = searchParams.get('name')
  const regNo = searchParams.get('regNo')
  const message = searchParams.get('message')

  const isSuccess = status === 'success' || status === 'already_registered'

  if (!status || !message) {
    return (
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Invalid Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please complete the attendance registration process first.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/events">Return to Events</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md py-8 px-4">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/events">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className={`rounded-full p-4 ${
              isSuccess ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isSuccess ? (
                <Check className="h-8 w-8 text-green-600" />
              ) : (
                <X className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-center">
            {isSuccess ? 'Attendance Confirmed!' : 'Registration Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {isSuccess ? (
            <>
              <div className="space-y-2">
                <p className="text-xl font-semibold">{name}</p>
                <p className="text-muted-foreground">Registration Number: {regNo}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </>
          ) : (
            <>
              <p className="text-red-600 font-medium">{message}</p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Please ensure:</p>
                <ul className="list-disc list-inside">
                  <li>You are in a well-lit environment</li>
                  <li>Your face is clearly visible</li>
                  <li>You are looking directly at the camera</li>
                  <li>There are no strong shadows on your face</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center gap-4">
          {isSuccess ? (
            <Button asChild>
              <Link href="/events">Return to Events</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/events">Cancel</Link>
              </Button>
              <Button asChild>
                <Link href={`/events/${searchParams.get('eventId')}/register`}>
                  Try Again
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
