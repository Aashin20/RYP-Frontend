"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Camera, Loader2, Search, UserPlus, ArrowLeft, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Mock data for faces in the database
const mockFaces = [
  {
    id: "1",
    name: "John Doe",
    registrationNumber: "REG001",
    imageUrl: "/placeholder.svg?height=200&width=200",
    addedOn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "Jane Smith",
    registrationNumber: "REG002",
    imageUrl: "/placeholder.svg?height=200&width=200",
    addedOn: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Robert Johnson",
    registrationNumber: "REG003",
    imageUrl: "/placeholder.svg?height=200&width=200",
    addedOn: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Emily Davis",
    registrationNumber: "REG004",
    imageUrl: "/placeholder.svg?height=200&width=200",
    addedOn: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "Michael Wilson",
    registrationNumber: "REG005",
    imageUrl: "/placeholder.svg?height=200&width=200",
    addedOn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function FacesManagement() {
  const [faces, setFaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    // Simulate API fetch
    setTimeout(() => {
      setFaces(mockFaces)
      setLoading(false)
    }, 1000)
  }, [router])

  const filteredFaces = faces.filter(
    (face) =>
      face.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      face.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteFace = (id: string) => {
    // In a real app, you would call an API to delete the face
    setFaces(faces.filter((face) => face.id !== id))
    toast({
      title: "Face Deleted",
      description: "The face has been removed from the database",
    })
  }

  return (
    <div className="container py-8 px-4">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/admin/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Face Recognition Database</h1>
          <p className="text-muted-foreground">Manage faces for automatic recognition</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Face
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <AddNewFaceForm
                onSuccess={() => {
                  toast({
                    title: "Face Added",
                    description: "New face has been added to the database",
                  })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Faces</CardTitle>
          <CardDescription>All faces registered in the facial recognition system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading faces...</p>
              </div>
            </div>
          ) : filteredFaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No faces match your search" : "No faces have been registered yet"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFaces.map((face) => (
                <Card key={face.id} className="overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={face.imageUrl || "/placeholder.svg"} alt={face.name} />
                      <AvatarFallback>{face.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{face.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{face.registrationNumber}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added: {new Date(face.addedOn).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteFace(face.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AddNewFaceForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [cameraActive, setCameraActive] = useState(false)
  const [photoTaken, setPhotoTaken] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  // Take photo
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        setPhotoTaken(true)
        stopCamera()
      }
    }
  }

  // Retake photo
  const retakePhoto = () => {
    setPhotoTaken(false)
    startCamera()
  }

  // Clean up camera on unmount
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !registrationNumber || !photoTaken) {
      return
    }

    setSubmitting(true)

    try {
      // Get image data from canvas
      const imageData = canvasRef.current?.toDataURL("image/jpeg")

      // In a real app, you would send this data to your server
      // await fetch('/api/faces', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     name,
      //     registrationNumber,
      //     photo: imageData
      //   }),
      //   headers: { 'Content-Type': 'application/json' }
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      onSuccess()

      // Reset form
      setName("")
      setRegistrationNumber("")
      setPhotoTaken(false)
      startCamera()
    } catch (error) {
      console.error("Error adding face:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Face</DialogTitle>
        <DialogDescription>Register a new face in the facial recognition database</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="Enter registration number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Face Photo</Label>
            <div className="border rounded-md overflow-hidden bg-muted">
              {cameraActive && !photoTaken ? (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button type="button" onClick={takePhoto} variant="secondary">
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>
              ) : null}

              {photoTaken ? (
                <div className="relative">
                  <canvas ref={canvasRef} className="w-full h-auto" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button type="button" onClick={retakePhoto} variant="secondary" size="sm">
                      Retake
                    </Button>
                  </div>
                </div>
              ) : null}

              {!cameraActive && !photoTaken ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Starting camera...</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting || !photoTaken || !name || !registrationNumber}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Database"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
