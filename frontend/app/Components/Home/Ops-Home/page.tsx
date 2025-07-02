"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth"
import { Upload, File, Eye, Trash2, FileText, Download, X, CheckCircle, AlertCircle } from "lucide-react"

interface Document {
  id: number
  file: string
  uploaded_at: string
  file_name: string
  
}

export default function FilesPage() {
  const { token } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("http://localhost:8000/documents/get-documents/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    const allowedExtensions = ["pptx", "docx", "xlsx"]
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (!extension || !allowedExtensions.includes(extension)) {
      setMessage({ type: "error", text: "Invalid file type. Only pptx, docx, xlsx files are allowed." })
      return
    }

    setSelectedFile(file)
    setMessage({ type: "", text: "" })
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const uploadFile = async () => {
    if (!selectedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const response = await fetch("http://localhost:8000/documents/upload-file/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setSelectedFile(null)
        fetchDocuments() // Refresh the list
      } else {
        setMessage({ type: "error", text: data.message || "Upload failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`http://localhost:8000/documents/delete-document/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Document deleted successfully" })
        fetchDocuments() // Refresh the list
      } else {
        setMessage({ type: "error", text: "Failed to delete document" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const downloadDocument = async (id: number, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/documents/download-documents/${id}`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setMessage({ type: "error", text: "Failed to download document" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const viewDocument = async (id: number) => {
  try {
    const response = await fetch(`http://localhost:8000/documents/view-documents/${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open the file in a new tab
      window.open(url, "_blank");

      // Optional: revoke the object URL after some time (say 1 minute)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);

    } else {
      setMessage({ type: "error", text: "Failed to load document" });
    }
  } catch (error) {
    setMessage({ type: "error", text: "Network error. Please try again." });
  }
};



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("presentation")) return <FileText className="h-4 w-4 text-orange-500" />
    if (fileType.includes("word")) return <FileText className="h-4 w-4 text-blue-500" />
    if (fileType.includes("sheet")) return <FileText className="h-4 w-4 text-green-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  return (
    <ProtectedRoute allowedUserTypes={["OPS_USER"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">File Management</h1>
            <p className="text-gray-600">Upload and manage documents</p>
          </div>

          {/* Messages */}
          {message.text && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
              className={message.type === "success" ? "border-green-200 bg-green-50" : ""}
            >
              <div className="flex items-center">
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-800 ml-2" : "ml-2"}>
                  {message.text}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">Supported formats: PPTX, DOCX, XLSX</p>
                <Input
                  type="file"
                  accept=".pptx,.docx,.xlsx"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer bg-transparent">
                    Choose File
                  </Button>
                </Label>
              </div>

              {/* Selected File */}
              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button onClick={uploadFile} disabled={uploading} size="sm">
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        
                        <TableHead>Uploaded</TableHead>
                        <TableHead>fileName</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                          <TableCell>{doc.file}</TableCell>
                          <TableCell>{doc.file_name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => viewDocument(doc.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc.id, doc.file_name)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
