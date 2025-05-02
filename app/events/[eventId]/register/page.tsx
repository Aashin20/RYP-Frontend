"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, MapPin, Loader2, Check, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

// Use fallback if environment variable is not set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001"

export default function RegisterAttendance({ params }: { params: { eventId: string } }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photoTaken, setPhotoTaken] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(50)
  const [selfieData, setSelfieData] = useState<string | null>(null) // Store base64 data
  const router = useRouter()
  const { toast } = useToast()

  // Start camera and save stream in state
  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Camera not supported",
        description: "Your browser does not support camera access, or you must use HTTPS/localhost.",
        variant: "destructive",
      });
      return;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })
      setStream(newStream)
      setCameraActive(true)
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop camera and clean up stream
  const stopCamera = () => {
    if (videoRef.current) videoRef.current.srcObject = null
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  // Assign stream to video element when both are ready
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current!.play()
      }
    }
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [cameraActive, stream])

  // Start camera on first step, stop after transition away
  useEffect(() => {
    if (step === 1 && !cameraActive && !stream) startCamera()
    if (step !== 1 && cameraActive) stopCamera()
    // eslint-disable-next-line
  }, [step, cameraActive, stream])

  // Camera cleanup on unmount
  useEffect(() => stopCamera, [])

  // Take photo: draw current frame to canvas and store as base64
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      
      if (!video.videoWidth || !video.videoHeight) {
        toast({
          title: "Camera not ready",
          description: "Try again in a second.",
          variant: "destructive"
        })
        return
      }
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Store the image data as base64 string immediately
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.9)
        setSelfieData(dataURL)
        console.log("Selfie captured and stored as base64")
        setPhotoTaken(true)
      } catch (error) {
        console.error("Error converting canvas to data URL:", error)
        toast({
          title: "Photo Error",
          description: "Could not process the image. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const retakePhoto = () => {
    setSelfieData(null)
    setPhotoTaken(false)
    setTimeout(() => {
      startCamera()
    }, 250)
  }

  // Location as before
  const getLocation = () => {
    setLocationLoading(true)
    setLocationError("")
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLocationLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
      },
      (error) => {
        setLocationError("Could not get your location. Please check permissions.")
        setLocationLoading(false)
      }
    )
  }

  // Multi-step logic
  const nextStep = () => {
    if (step === 1 && !photoTaken) {
      toast({ title: "Photo Required", description: "Please take a selfie to continue", variant: "destructive" })
      return
    }
    if (step === 1 && cameraActive) stopCamera()
    if (step < 2) {
      setStep(step + 1)
      setProgress(100)
    }
  }
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setProgress(50)
      // Back to selfie? if so, show camera again!
      setPhotoTaken(false)
      setSelfieData(null)
      setTimeout(() => startCamera(), 250)
    }
  }

  // Convert base64 to Blob - more reliable than canvas.toBlob()
  const base64ToBlob = (base64: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Split the base64 string to get data after "base64,"
        const parts = base64.split(';base64,')
        const contentType = parts[0].split(':')[1]
        const raw = window.atob(parts[1])
        const rawLength = raw.length
        const uInt8Array = new Uint8Array(rawLength)
        
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i)
        }
        
        const blob = new Blob([uInt8Array], { type: contentType })
        console.log(`Created blob of type ${contentType}, size: ${blob.size} bytes`)
        resolve(blob)
      } catch (error) {
        console.error("Error converting base64 to blob:", error)
        reject(error)
      }
    })
  }

  const submitAttendance = async () => {
    if (!photoTaken || !location || !selfieData) {
      toast({ 
        title: "Missing Information", 
        description: "Please complete all steps before submitting", 
        variant: "destructive" 
      })
      return
    }
    
    setSubmitting(true)
    try {
      const selfieBlob = await base64ToBlob(selfieData)
      
      if (!selfieBlob) {
        toast({ 
          title: "Photo Error", 
          description: "Could not process your selfie. Please retake.", 
          variant: "destructive" 
        })
        setSubmitting(false)
        return
      }
      
      const eventId = params.eventId.trim()
      
      const formData = new FormData()
      formData.append("event_id", eventId)
      formData.append("user_lat", String(location.lat))
      formData.append("user_lng", String(location.lng))
      formData.append("selfie", selfieBlob, "selfie.jpg")
      
      const endpoint = `${API_BASE_URL}/register_attendance`
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Unknown error"
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || "Server error"
        } catch (e) {
          errorMessage = errorText || "Server error"
        }
        
        // Handle specific error cases
        if (response.status === 404) {
          errorMessage = "Event not found. Please check the event ID and try again."
        } else if (response.status === 401) {
          // Redirect to confirmation page with error
          router.push(`/events/${eventId}/confirmation?` + new URLSearchParams({
            status: 'error',
            message: errorMessage,
            eventId: eventId // Pass eventId for "Try Again" functionality
          }))
          return
        }
        
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      if (result.status === "success" || result.status === "already_registered") {
        toast({ 
          title: "Attendance Registered", 
          description: result.message, 
          variant: "default" 
        })
        
        // Redirect to confirmation page with success details
        router.push(`/events/${eventId}/confirmation?` + new URLSearchParams({
          status: result.status,
          name: result.data.name,
          regNo: result.data.reg_no,
          message: result.message
        }))
      } else {
        // Handle unexpected status
        router.push(`/events/${eventId}/confirmation?` + new URLSearchParams({
          status: 'error',
          message: result.message || "Unexpected error occurred",
          eventId: eventId
        }))
      }
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({ 
        title: "Submission Error", 
        description: error?.message || "There was a problem registering your attendance. Please try again.", 
        variant: "destructive" 
      })
      setSubmitting(false)
    }
  }
  return (
    <div className="container max-w-md py-8 px-4">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/events">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
      </Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Register Attendance</h1>
        <p className="text-muted-foreground mt-1">Complete all steps to mark your attendance</p>
        <p className="text-xs text-muted-foreground mt-1">Event ID: {params.eventId}</p>
      </div>
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span className={step >= 1 ? "font-medium text-primary" : ""}>Take Selfie</span>
          <span className={step >= 2 ? "font-medium text-primary" : ""}>Confirm Location</span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Take a Selfie"}
            {step === 2 && "Confirm Location"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Take a selfie for facial recognition"}
            {step === 2 && "Confirm your current location"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden bg-muted">
                {/* Both elements exist always so no race */}
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-auto ${photoTaken ? "hidden" : ""}`}
                    style={{ background: "#000" }}
                  />
                  {/* Canvas for live preview */}
                  <canvas
                    ref={canvasRef}
                    className={`w-full h-auto ${photoTaken ? "" : "hidden"}`}
                  />
                  {/* Show base64 image if available (fallback) */}
                  {selfieData && photoTaken && (
                    <img 
                      src={selfieData} 
                      alt="Selfie Preview"
                      className={`w-full h-auto ${photoTaken ? "" : "hidden"}`}
                      style={{ display: photoTaken ? "block" : "none" }}
                    />
                  )}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    {photoTaken ? (
                      <Button onClick={retakePhoto} variant="secondary" size="sm">
                        Retake
                      </Button>
                    ) : (
                      <Button onClick={takePhoto} variant="secondary">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-center">
                <p>Your face will be used to identify you in our system.</p>
                <p className="mt-1 text-muted-foreground">No need to enter personal details.</p>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              {!location ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">We need your location to verify your attendance</p>
                  <Button onClick={getLocation} disabled={locationLoading} className="w-full">
                    {locationLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Current Location
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="rounded-full bg-green-100 p-3">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-center font-medium">Location captured successfully</p>
                  <div className="text-sm text-muted-foreground text-center">
                    <p>Latitude: {location.lat.toFixed(6)}</p>
                    <p>Longitude: {location.lng.toFixed(6)}</p>
                  </div>
                </div>
              )}
              {locationError && <p className="text-sm text-destructive mt-1">{locationError}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep}>Previous</Button>
          ) : (
            <div></div>
          )}
          {step < 2 ? (
            <Button onClick={nextStep} disabled={!photoTaken}>
              Next
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={submitAttendance} 
              disabled={submitting || !location}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
