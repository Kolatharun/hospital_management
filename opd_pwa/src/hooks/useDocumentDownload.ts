import { useState } from 'react';

export const useDocumentDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadDocument = async (url: string, filename: string) => {
    setIsDownloading(true);
    try {
      // Simulate download
      await new Promise((res) => setTimeout(res, 800));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Handle download error
    } finally {
      setIsDownloading(false);
    }
  };

  return { isDownloading, downloadDocument };
};
