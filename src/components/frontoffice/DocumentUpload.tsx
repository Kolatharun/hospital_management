import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Camera, X, Search, User, Eye, Trash2, Image, Loader2, Save, Download } from 'lucide-react';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { documentService, Document } from '@/services/documentService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const getDocumentFileUrl = (documentId: string, download = false): string => {
  if (!documentId) return '';
  const token = localStorage.getItem('access_token');
  const baseUrl = `${API_BASE_URL}/documents/${documentId}/file`;
  const params = new URLSearchParams();
  if (token) params.append('token', token);
  if (download) params.append('download', 'true');
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_TYPES = [
  'Lab Report',
  'X-Ray',
  'ECG',
  'Prescription',
  'Insurance Card',
  'ID Proof',
  'Previous Medical Records',
  'Referral Letter',
  'Other',
];

export function DocumentUpload() {
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, documentsData] = await Promise.all([
        appointmentService.getTodayAppointments(),
        documentService.getTodayDocuments(),
      ]);
      setAppointments(appointmentsData);
      setDocuments(documentsData.items);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(
    apt =>
      (apt.patient_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (apt.patient_mr_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const patientDocuments = selectedAppointment
    ? documents.filter(doc => doc.patient_id === selectedAppointment.patient_id)
    : [];

  const handleSelectPatient = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDocumentType('');
    setCapturedImage(null);
    setSelectedFiles([]);
  };

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      return `"${file.name}" is not a supported file type. Please upload an image (JPG, PNG, GIF, WebP, BMP) or PDF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `"${file.name}" is ${sizeMB}MB which exceeds the 10MB limit. Please choose a smaller file.`;
    }
    if (file.size === 0) {
      return `"${file.name}" is empty. Please choose a valid file.`;
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!documentType) {
      toast({
        title: 'Select Document Type',
        description: 'Please select a document type before choosing files.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid File',
          description: error,
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setSelectedFiles(fileArray);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveUpload = async () => {
    if (!selectedAppointment) {
      toast({
        title: 'No Patient Selected',
        description: 'Please select a patient before uploading documents.',
        variant: 'destructive',
      });
      return;
    }

    if (!documentType) {
      toast({
        title: 'Select Document Type',
        description: 'Please select a document type before uploading.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        const uploadedDoc = await documentService.upload(
          file,
          selectedAppointment.patient_id,
          documentType,
          selectedAppointment.id
        );
        setDocuments(prev => [uploadedDoc, ...prev]);
      }

      toast({
        title: 'Documents Uploaded',
        description: `${selectedFiles.length} document(s) uploaded successfully.`,
      });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    if (!documentType) {
      toast({
        title: 'Select Document Type',
        description: 'Please select a document type before taking a photo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const saveCapturedImage = async () => {
    if (!capturedImage || !selectedAppointment || !documentType) return;

    setIsUploading(true);

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const uploadedDoc = await documentService.upload(
        file,
        selectedAppointment.patient_id,
        documentType,
        selectedAppointment.id
      );

      setDocuments(prev => [uploadedDoc, ...prev]);
      setCapturedImage(null);

      toast({
        title: 'Photo Saved',
        description: 'Document photo saved successfully.',
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to save photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    const url = getDocumentFileUrl(doc.id, true);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteDocument = async (docId: string) => {
    try {
      await documentService.delete(docId);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      toast({
        title: 'Document Deleted',
        description: 'Document removed successfully.',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Document Upload</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-4 h-4" />
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedAppointment ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredAppointments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No patients found
                    </p>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleSelectPatient(apt)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {apt.patient_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {apt.patient_mr_number}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Select</Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {selectedAppointment.patient_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.patient_mr_number}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedAppointment(null);
                        setCapturedImage(null);
                        setSelectedFiles([]);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Document Type <span className="text-destructive">*</span></Label>
                  <Select value={documentType} onValueChange={(value) => {
                    setDocumentType(value);
                    setSelectedFiles([]);
                    setCapturedImage(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      className="w-full h-24 flex-col gap-2"
                      onClick={() => {
                        if (!documentType) {
                          toast({
                            title: 'Select Document Type',
                            description: 'Please select a document type before choosing files.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                    >
                      <Upload className="w-6 h-6" />
                      <span>Choose File</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex-col gap-2"
                    onClick={startCamera}
                    disabled={isUploading}
                  >
                    <Camera className="w-6 h-6" />
                    <span>Take Photo</span>
                  </Button>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <Label>Selected Files ({selectedFiles.length})</Label>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {file.type.startsWith('image') ? (
                                <Image className="w-5 h-5 text-primary" />
                              ) : (
                                <FileText className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSelectedFile(index)}
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleSaveUpload}
                      className="w-full gap-2"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isUploading ? 'Uploading...' : `Save & Upload ${selectedFiles.length > 1 ? `(${selectedFiles.length} files)` : ''}`}
                    </Button>
                  </div>
                )}

                {/* Captured Image Preview */}
                {capturedImage && (
                  <div className="space-y-3">
                    <Label>Captured Photo</Label>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full max-h-48 object-contain bg-muted"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={saveCapturedImage}
                        className="flex-1 gap-2"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isUploading ? 'Saving...' : 'Save Photo'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCapturedImage(null)}
                        disabled={isUploading}
                      >
                        Retake
                      </Button>
                    </div>
                  </div>
                )}

                {/* Patient's Documents */}
                {patientDocuments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents ({patientDocuments.length})</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {patientDocuments.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {doc.file_type.startsWith('image') ? (
                                <Image className="w-5 h-5 text-primary" />
                              ) : (
                                <FileText className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doc.document_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.file_name} • {doc.file_size_formatted || `${doc.file_size} bytes`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setPreviewDocument(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Documents Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-4 h-4" />
              Today's Uploads
              <Badge className="ml-2">{documents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No documents uploaded today
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {doc.file_type.startsWith('image') ? (
                          <Image className="w-5 h-5 text-primary" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{doc.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type} • {doc.patient_mr_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPreviewDocument(doc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Camera Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1 gap-2">
                <Camera className="w-4 h-4" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDocument?.document_type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Patient: </span>
                <span className="font-medium">{previewDocument?.patient_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">MR: </span>
                <span className="font-medium">{previewDocument?.patient_mr_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">File: </span>
                <span className="font-medium">{previewDocument?.file_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Uploaded: </span>
                <span className="font-medium">
                  {previewDocument && new Date(previewDocument.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            {previewDocument && (
              <div className="rounded-lg overflow-hidden border bg-muted">
                {previewDocument.file_type.startsWith('image') ? (
                  <img
                    src={getDocumentFileUrl(previewDocument.id)}
                    alt={previewDocument.file_name}
                    className="w-full max-h-96 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="p-8 text-center" style="color: var(--muted-foreground)">
                          <p class="text-sm">Unable to load image preview.</p>
                          <p class="text-xs" style="margin-top: 0.25rem">The file may have been moved or deleted.</p>
                        </div>
                      `;
                    }}
                  />
                ) : previewDocument.file_type === 'application/pdf' ? (
                  <iframe
                    src={getDocumentFileUrl(previewDocument.id)}
                    title={previewDocument.file_name}
                    className="w-full h-96"
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p>Preview not available for this file type</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.open(getDocumentFileUrl(previewDocument.id), '_blank')}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
