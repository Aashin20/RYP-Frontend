"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, MapPin, Loader2, Check, ArrowLeft, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

// Use fallback if environment variable is not set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

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
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(33)
  const [selfieData, setSelfieData] = useState<string | null>(null) // Store base64 data
  const [regNumber, setRegNumber] = useState<string>("")
  const [regNumberError, setRegNumberError] = useState("")
  const [eventInfo, setEventInfo] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventError, setEventError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Fetch event details on mount
  useEffect(() => {
    const fetchEventDetails = async () => {
      setEventLoading(true)
      try {
        // This endpoint isn't shown in your backend code, but it's likely to exist
        const response = await fetch(`${API_BASE_URL}/event/${params.eventId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({})  // include a payload here if your backend expects one
})

        
        if (!response.ok) {
          if (response.status === 404) {
            setEventError("Event not found. Please check the event ID.")
          } else {
            setEventError("Failed to fetch event details")
          }
          setEventLoading(false)
          return
        }
        
        const data = await response.json()
        setEventInfo(data)
        
        // Load registration number from localStorage if available
        const savedRegNo = localStorage.getItem('user_reg_no')
        if (savedRegNo) {
          setRegNumber(savedRegNo)
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        setEventError("Failed to fetch event details. Please try again later.")
      } finally {
        setEventLoading(false)
      }
    }
    
    fetchEventDetails()
  }, [params.eventId])

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

  // Start camera on step 2, stop after transition away
  useEffect(() => {
    if (step === 2 && !cameraActive && !stream) startCamera()
    if (step !== 2 && cameraActive) stopCamera()
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

  // Location functionality
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

  // Validate registration number
  const validateRegNumber = () => {
    if (!regNumber || regNumber.trim() === "") {
      setRegNumberError("Please enter your registration number")
      return false
    }
    
    // Additional validation rules can be added here based on your requirements
    // For example, format checking, length, etc.
    
    setRegNumberError("")
    return true
  }

  // Multi-step logic with added reg number step
  const nextStep = () => {
    if (step === 1) {
      if (!validateRegNumber()) return
      
      // Save reg number to localStorage for persistence
      localStorage.setItem('user_reg_no', regNumber)
      setStep(2)
      setProgress(66)
      return
    }
    
    if (step === 2 && !photoTaken) {
      toast({ 
        title: "Photo Required", 
        description: "Please take a selfie to continue", 
        variant: "destructive" 
      })
      return
    }
    
    if (step === 2 && cameraActive) stopCamera()
    
    if (step === 2) {
      setStep(3)
      setProgress(100)
    }
  }
  
  const prevStep = () => {
    if (step > 1) {
      if (step === 3) {
        setStep(2)
        setProgress(66)
        // Back to selfie? if so, show camera again!
        setPhotoTaken(false)
        setSelfieData(null)
        setTimeout(() => startCamera(), 250)
      } else if (step === 2) {
        stopCamera()
        setStep(1)
        setProgress(33)
      }
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

  // Update the submitAttendance function to handle the new response format
// Refactored submitAttendance function
const submitAttendance = async () => {
  if (!photoTaken || !location || !selfieData || !regNumber) {
    toast({ 
      title: "Missing Information", 
      description: "Please complete all steps before submitting", 
      variant: "destructive" 
    });
    return;
  }
  
  setSubmitting(true);
  try {
    const selfieBlob = await base64ToBlob(selfieData);
    
    if (!selfieBlob) {
      throw new Error("Could not process selfie image");
    }

    const formData = new FormData();
    formData.append("event_id", params.eventId);
    formData.append("reg_no", regNumber);
    formData.append("user_lat", location.lat.toString());
    formData.append("user_lng", location.lng.toString());
    formData.append("selfie", selfieBlob, "selfie.jpg");

    const response = await fetch(`${API_BASE_URL}/register_attendance`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem('registrationData', JSON.stringify({
        success: true,
        event_title: eventInfo?.title,
        event_date: eventInfo?.date,
        event_location: eventInfo?.location,
        selfie_url: selfieData,
        message: result.message
      }));

      toast({ 
        title: "Success", 
        description: result.message || "Attendance registered successfully", 
        variant: "default" 
      });

      setTimeout(() => {
        router.replace(`/events/${params.eventId}/confirmation?reg_no=${encodeURIComponent(regNumber)}`);
      }, 1500);
      
    } else {
      let errorMessage = "Failed to register attendance";
      
      switch (response.status) {
        case 400:
          errorMessage = result.detail || "Invalid request. Please check your inputs.";
          break;
        case 403:
          errorMessage = result.detail || "Face verification failed. Please try again.";
          break;
        case 404:
          errorMessage = result.detail || "Registration not found. Please contact admin.";
          break;
        case 500:
          errorMessage = "Server error. Please try again later.";
          break;
      }

      localStorage.setItem('registrationData', JSON.stringify({
        success: false,
        message: errorMessage
      }));
      
      toast({ 
        title: "Registration Failed", 
        description: errorMessage,
        variant: "destructive" 
      });

      if (response.status === 403) {
        setStep(2);
        setProgress(66);
        setPhotoTaken(false);
        setSelfieData(null);
        setTimeout(() => startCamera(), 250);
      }
    }

  } catch (error) {
    console.error("Submission error:", error);
    
    localStorage.setItem('registrationData', JSON.stringify({
      success: false,
      message: "Network error or server unavailable"
    }));

    toast({ 
      title: "Connection Error", 
      description: "Could not connect to the server. Please check your internet connection.",
      variant: "destructive" 
    });
  } finally {
    setSubmitting(false);
  }
};  // Show loading or error state for event
  if (eventLoading) {
    return (
      <div className="container max-w-md py-12 px-4 flex flex-col items-center justify-center">
        <Card className="w-full">
          <CardContent className="py-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading event details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (eventError) {
    return (
      <div className="container max-w-md py-12 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Event Error</CardTitle>
          </CardHeader>
          <CardContent className="py-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{eventError}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  if (registrationError) {
  return (
    <div className="container max-w-md py-12 px-4">
      <RegistrationError 
        message={registrationError}
        eventId={params.eventId}
        onRetry={() => {
          setRegistrationError(null)
          setStep(1)
          setProgress(33)
        }}
      />
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Register Attendance</h1>
        <p className="text-muted-foreground mt-1">Complete all steps to mark your attendance</p>
        {eventInfo && eventInfo.title && (
          <p className="text-base font-medium text-primary mt-1">
            {eventInfo.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Event ID: {params.eventId}</p>
      </div>
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span className={step >= 1 ? "font-medium text-primary" : ""}>Registration</span>
          <span className={step >= 2 ? "font-medium text-primary" : ""}>Selfie</span>
          <span className={step >= 3 ? "font-medium text-primary" : ""}>Location</span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Faculty Id"}
            {step === 2 && "Take a Selfie"}
            {step === 3 && "Confirm Location"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter your faculty id to identify yourself"}
            {step === 2 && "Take a selfie for facial recognition"}
            {step === 3 && "Confirm your current location"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="regNumber" className="text-sm font-medium">
                  Faculty ID
                </label>
                <input
                  type="text"
                  id="regNumber"
                  value={regNumber}
                  onChange={(e) => {
                    setRegNumber(e.target.value)
                    setRegNumberError("")
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter your Faculty ID"
                />
                {regNumberError && (
                  <p className="text-sm text-destructive">{regNumberError}</p>
                )}
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-center">
                <p>Make sure to double check you Faculty ID!!</p>
                
              </div>
            </div>
          )}
          
          {step === 2 && (
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
                <p className="mt-1 text-muted-foreground">Ensure your face is clearly visible.</p>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              {!location ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">We need your location to verify if you are in the venue</p>
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
          {step < 3 ? (
            <Button onClick={nextStep}>
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
