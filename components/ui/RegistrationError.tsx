// components/RegistrationError.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface RegistrationErrorProps {
  message: string
  eventId: string
  onRetry?: () => void
}

export function RegistrationError({ message, eventId, onRetry }: RegistrationErrorProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-destructive">Registration Failed</CardTitle>
      </CardHeader>
      <CardContent className="py-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">
          {message || "Failed to register attendance"}
        </p>
        <p className="text-sm text-muted-foreground">
          Please check your inputs and try again
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button variant="outline" asChild>
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Link>
        </Button>
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
