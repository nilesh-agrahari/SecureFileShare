"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth"
import { File, FileText, Download, CheckCircle, AlertCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Document {
  id: number
  file: string
  uploaded_at: string
  file_name: string
}

export default function ClientFilesPage() {
  const { token } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [searchTerm, setSearchTerm] = useState("")

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
      } else {
        setMessage({ type: "error", text: "Failed to load documents" })
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const viewDocument = async (id: number) => {
  try {
    const response = await fetch(`http://localhost:8000/documents/generate-link/${id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const secureUrl = data.download_url;

      // Open secure, time-limited link in new tab
      window.open(secureUrl, "_blank");

    } else {
      setMessage({ type: "error", text: "Failed to generate secure link." });
    }

  } catch (error) {
    setMessage({ type: "error", text: "Network error. Please try again." });
  }
};



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
        setMessage({ type: "success", text: `${fileName} downloaded successfully` })
      } else {
        setMessage({ type: "error", text: "Failed to download document" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (extension === "pptx") return <FileText className="h-4 w-4 text-orange-500" />
    if (extension === "docx") return <FileText className="h-4 w-4 text-blue-500" />
    if (extension === "xlsx") return <FileText className="h-4 w-4 text-green-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toUpperCase() || "FILE"
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <ProtectedRoute allowedUserTypes={["CLIENT_USER"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Document Library</h1>
            <p className="text-gray-600">View and download available documents</p>
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

          {/* Documents List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Available Documents</CardTitle>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{searchTerm ? "No documents found matching your search" : "No documents available"}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getFileIcon(doc.file_name)}
                              <div>
                                <p className="font-medium text-gray-900">{doc.file}</p>
                                <Badge variant="outline" className="text-xs">
                                  {getFileExtension(doc.file_name)}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{doc.file_name}</TableCell>
                          <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewDocument(doc.id)}
                              className="flex items-center space-x-2"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <File className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PowerPoint Files</CardTitle>
                <FileText className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter((doc) => doc.file_name.toLowerCase().endsWith(".pptx")).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Word Documents</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter((doc) => doc.file_name.toLowerCase().endsWith(".docx")).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
