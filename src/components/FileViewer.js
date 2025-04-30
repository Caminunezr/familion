import React, { useEffect, useState } from 'react';
import './FileViewer.css';

const FileViewer = ({ filePath }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!filePath) return;

    // Si es ruta local, usa la función de preload
    if (window.api && (filePath.startsWith('file://') || filePath.startsWith('/'))) {
      const ruta = filePath.replace('file://', '');
      window.api.leerArchivoComoDataUrl(ruta)
        .then(setSrc)
        .catch(() => setSrc(null));
    } else {
      setSrc(filePath);
    }
  }, [filePath]);

  if (!src) return <div style={{ textAlign: 'center', color: '#aaa' }}>No se puede mostrar el archivo</div>;

  if (src.includes('application/pdf')) {
    return <iframe src={src} width="100%" height="400px" title="Vista previa PDF"></iframe>;
  }
  if (src.includes('image/')) {
    return <img src={src} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '400px' }} />;
  }
  return <a href={src} target="_blank" rel="noopener noreferrer">Descargar archivo</a>;
};

export default FileViewer;
