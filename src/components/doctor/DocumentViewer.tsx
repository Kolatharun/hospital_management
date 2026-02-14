import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, FileText, RotateCcw } from 'lucide-react';
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
            default:
                break;
        }
    }, [isOpen, goPrev, goNext, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const getDocumentFileUrl = (doc: PatientDocument) => {
        if (!doc) return '';
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        return `${baseUrl}/documents/${doc.id}/file?token=${token}`;
    };

    if (!isOpen || !currentDoc) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 gap-0 bg-black/90 border-none outline-none overflow-hidden flex flex-col items-stretch">

                {/* Header/Controls Bar */}
                <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-md z-50 text-white">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="hover:bg-white/10 text-white rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate max-w-[200px] md:max-w-md">
                                {currentDoc.file_name}
                            </span>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] py-0 border-white/20 text-white/70">
                                    {currentDoc.document_type}
                                </Badge>
                                <span className="text-[10px] text-white/50">
                                    {currentIndex + 1} of {documents.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(Math.max(25, zoom - 25))}
                            disabled={zoom <= 25}
                            className="hover:bg-white/10 text-white h-9 w-9"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </Button>
                        <div className="min-w-[4rem] text-center font-mono text-sm text-white/90">
                            {zoom}%
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(Math.min(400, zoom + 25))}
                            disabled={zoom >= 400}
                            className="hover:bg-white/10 text-white h-9 w-9"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </Button>
                        <div className="w-px h-6 bg-white/20 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(100)}
                            className="hover:bg-white/10 text-white h-9 w-9"
                            title="Reset Zoom"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Viewer Area */}
                <div className="relative flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 scrollbar-hide">
                    {/* Left Arrow */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={goPrev}
                            disabled={currentIndex === 0}
                            className="w-12 h-12 rounded-full opacity-50 hover:opacity-100 disabled:opacity-0 transition-opacity bg-white/10 border-none text-white lg:w-16 lg:h-16"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>
                    </div>

                    {/* Right Arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={goNext}
                            disabled={currentIndex === documents.length - 1}
                            className="w-12 h-12 rounded-full opacity-50 hover:opacity-100 disabled:opacity-0 transition-opacity bg-white/10 border-none text-white lg:w-16 lg:h-16"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    </div>

                    {/* Main Content Area */}
                    <div className="transition-all duration-300 ease-in-out transform flex items-center justify-center min-h-full min-w-full">
                        {currentDoc.file_type?.startsWith('image/') ? (
                            <img
                                key={currentDoc.id}
                                src={getDocumentFileUrl(currentDoc)}
                                alt={currentDoc.file_name}
                                style={{
                                    maxWidth: zoom === 100 ? '100%' : 'none',
                                    maxHeight: zoom === 100 ? '100%' : 'none',
                                    transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
                                    transition: 'transform 0.2s ease-out, max-width 0.2s ease-out, max-height 0.2s ease-out',
                                    objectFit: 'contain'
                                }}
                                className="shadow-2xl rounded-sm pointer-events-none select-none"
                            />
                        ) : currentDoc.file_type === 'application/pdf' ? (
                            <div
                                className="bg-white rounded shadow-2xl overflow-hidden flex flex-col"
                                style={{
                                    width: zoom === 100 ? '90%' : `${zoom}%`,
                                    height: '90%',
                                    minHeight: '80vh',
                                    transition: 'width 0.2s ease-out'
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
                            <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <FileText className="w-20 h-20 mx-auto mb-6 text-white/20" />
                                <h3 className="text-xl font-medium text-white mb-2">Unsupported Preview</h3>
                                <p className="text-white/60 mb-6">Preview not available for this file type.</p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                                >
                                    <a
                                        href={getDocumentFileUrl(currentDoc)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download to view
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
