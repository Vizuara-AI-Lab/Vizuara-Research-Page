"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfThumbnailProps {
  url: string;
  className?: string;
}

export default function PdfThumbnail({ url, className = "" }: PdfThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  return (
    <div className={`relative overflow-hidden bg-surface-alt ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      )}
      <Document
        file={proxyUrl}
        onLoadSuccess={() => setLoaded(true)}
        onLoadError={() => setLoaded(true)}
        loading={null}
      >
        <Page
          pageNumber={1}
          width={400}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
