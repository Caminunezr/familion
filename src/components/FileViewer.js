import React, { useState, useEffect } from 'react';
import { getFile } from '../utils/fileStorage';
import './FileViewer.css';

const FileViewer = ({ filePath }) => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let url = null;

    const fetchFile = async () => {
      if (!filePath) {
        setLoading(false);
        return;
      }

      try {
        // El formato de filePath es "directory/fileId"
        const fileId = filePath.split('/')[1];
        const fileData = await getFile(fileId);
        
        if (!fileData) {
          throw new Error('Archivo no encontrado');
        }
        
        setFile(fileData);
        
        // Crear un Blob con los datos binarios
        const blob = new Blob([fileData.data], { type: fileData.type });
        // Crear una URL para el blob
        url = URL.createObjectURL(blob);
        setFileUrl(url);
      } catch (err) {
        console.error('Error al cargar el archivo:', err);
        setError('No se pudo cargar el archivo: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
    
    // Limpiar URL al desmontar o cuando filePath cambia
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [filePath]); // Solo filePath como dependencia, ya manejamos la url localmente

  if (loading) return <div className="file-viewer-loading">Cargando archivo...</div>;
  if (error) return <div className="file-viewer-error">{error}</div>;
  if (!file || !fileUrl) return <div className="file-viewer-empty">No hay archivo para mostrar</div>;

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <h3>{file.name}</h3>
        <a href={fileUrl} download={file.name} className="download-button">
          Descargar
        </a>
      </div>
      
      <div className="file-preview-container">
        {file.type.startsWith('image/') ? (
          <img src={fileUrl} alt={file.name} className="file-preview" />
        ) : file.type === 'application/pdf' ? (
          <object 
            data={fileUrl} 
            type="application/pdf" 
            className="pdf-preview"
          >
            <div className="pdf-fallback">
              <p>Tu navegador no puede mostrar el PDF directamente.</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="fallback-button">
                Abrir PDF en nueva pestaña
              </a>
            </div>
          </object>
        ) : (
          <div className="file-unavailable">
            <div className="file-icon">📄</div>
            <p>Vista previa no disponible para este tipo de archivo ({file.type || 'desconocido'}).</p>
            <a href={fileUrl} download={file.name} className="fallback-button">
              Descargar Archivo
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
