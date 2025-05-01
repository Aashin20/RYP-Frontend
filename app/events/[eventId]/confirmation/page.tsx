import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, CalendarCheck } from "lucide-react"

export default function ConfirmationPage() {
  return (
    <div className="container max-w-md py-12 px-4">
      <Card className="text-center border-none shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Attendance Registered!</CardTitle>
          <CardDescription>Your attendance has been successfully recorded</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="rounded-lg bg-muted p-4 mb-6">
            <p className="text-muted-foreground">
              Thank you for registering your presence. Your attendance has been recorded with facial recognition and
              location data.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
