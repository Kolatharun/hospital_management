import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Document as PatientDocument } from '@/services/documentService';

interface DocumentViewerProps {
  documents: PatientDocument[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ documents, initialIndex, isOpen, onClose }: DocumentViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(100);
    }
  }, [isOpen, initialIndex]);

  const currentDoc = documents[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoom(100);
    }
  }, [currentIndex, documents.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoom(100);
    }
  }, [currentIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        goPrev();
        break;
      case 'ArrowRight':
        goNext();
        break;
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        setZoom(prev => Math.min(300, prev + 25));
        break;
      case '-':
        setZoom(prev => Math.max(25, prev - 25));
        break;
      case '0':
        setZoom(100);
        break;
      default:
        break;
    }
  }, [isOpen, goPrev, goNext, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getDocumentFileUrl = (doc: PatientDocument) => {
    if (!doc) return '';
    const token = localStorage.getItem('access_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${baseUrl}/documents/${doc.id}/file?token=${token}`;
  };

  if (!isOpen || !currentDoc) return null;

  const zoomPresets = [50, 75, 100, 150, 200];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] p-0 gap-0 border-none outline-none overflow-hidden flex flex-col bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200">

        {/* Header Bar - Modern Hospital Style */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-50">
          {/* Left: Close & Document Info */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="h-8 w-px bg-gray-200" />

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800 truncate max-w-[300px] md:max-w-lg">
                {currentDoc.file_name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="text-[10px] px-2 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                  {currentDoc.document_type}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(currentDoc.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Navigation Counter */}
          <div className="hidden md:flex items-center gap-3 px-6 py-2 bg-gray-50 rounded-full border border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="h-8 w-8 rounded-full hover:bg-gray-200 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              {currentIndex + 1} of {documents.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              disabled={currentIndex === documents.length - 1}
              className="h-8 w-8 rounded-full hover:bg-gray-200 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Zoom & Actions */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
                className="h-8 w-8 rounded hover:bg-gray-200 disabled:opacity-30"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>

              <div className="relative">
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[70px] text-center"
                >
                  {zoomPresets.map(preset => (
                    <option key={preset} value={preset}>{preset}%</option>
                  ))}
                  {!zoomPresets.includes(zoom) && (
                    <option value={zoom}>{zoom}%</option>
                  )}
                </select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(300, zoom + 25))}
                disabled={zoom >= 300}
                className="h-8 w-8 rounded hover:bg-gray-200 disabled:opacity-30"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(100)}
                className="h-8 w-8 rounded hover:bg-gray-200"
                title="Reset Zoom (0)"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-8 w-px bg-gray-200 mx-1" />

            {/* Additional Actions */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-lg hover:bg-gray-100"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 rounded-lg hover:bg-gray-100"
              title="Download"
            >
              <a href={getDocumentFileUrl(currentDoc)} download={currentDoc.file_name}>
                <Download className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Main Viewer Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Document Container with proper centering */}
          <div className="absolute inset-0 overflow-auto flex items-center justify-center p-8">
            {/* Left Navigation Button */}
            {documents.length > 1 && (
              <Button
                variant="secondary"
                size="icon"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="fixed left-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full
                  bg-white shadow-lg border border-gray-200
                  hover:bg-gray-50 hover:shadow-xl hover:scale-105
                  disabled:opacity-0 disabled:pointer-events-none
                  transition-all duration-200"
              >
                <ChevronLeft className="w-7 h-7 text-gray-700" />
              </Button>
            )}

            {/* Right Navigation Button */}
            {documents.length > 1 && (
              <Button
                variant="secondary"
                size="icon"
                onClick={goNext}
                disabled={currentIndex === documents.length - 1}
                className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full
                  bg-white shadow-lg border border-gray-200
                  hover:bg-gray-50 hover:shadow-xl hover:scale-105
                  disabled:opacity-0 disabled:pointer-events-none
                  transition-all duration-200"
              >
                <ChevronRight className="w-7 h-7 text-gray-700" />
              </Button>
            )}

            {/* Document Display */}
            <div
              className="flex items-center justify-center transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center'
              }}
            >
              {currentDoc.file_type?.startsWith('image/') ? (
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                  <img
                    key={currentDoc.id}
                    src={getDocumentFileUrl(currentDoc)}
                    alt={currentDoc.file_name}
                    className="max-w-[85vw] max-h-[80vh] object-contain select-none"
                    style={{
                      display: 'block',
                    }}
                    draggable={false}
                  />
                </div>
              ) : currentDoc.file_type === 'application/pdf' ? (
                <div
                  className="bg-white rounded-lg shadow-2xl overflow-hidden"
                  style={{
                    width: '85vw',
                    height: '80vh',
                    maxWidth: '1200px'
                  }}
                >
                  <iframe
                    key={currentDoc.id}
                    src={getDocumentFileUrl(currentDoc)}
                    title={currentDoc.file_name}
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="text-center p-16 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Preview Unavailable</h3>
                  <p className="text-gray-500 mb-6">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <a
                      href={getDocumentFileUrl(currentDoc)}
                      download={currentDoc.file_name}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Thumbnail Strip (for multiple documents) */}
        {documents.length > 1 && (
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {documents.map((doc, idx) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoom(100);
                  }}
                  className={`
                    relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200
                    ${idx === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                      : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                    }
                  `}
                >
                  {doc.file_type?.startsWith('image/') ? (
                    <img
                      src={getDocumentFileUrl(doc)}
                      alt={doc.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {idx === currentIndex && (
                    <div className="absolute inset-0 bg-blue-500/10" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Navigation (shown on small screens) */}
        <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="h-10 w-10 rounded-full hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {currentIndex + 1} / {documents.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              disabled={currentIndex === documents.length - 1}
              className="h-10 w-10 rounded-full hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
