import React, { useState, useEffect } from 'react';
import { getFile } from '../utils/fileStorage';
import './FileViewer.css';

const FileViewer = ({ filePath }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFile = async () => {
      if (!filePath) {
        setLoading(false);
        return;
      }

      try {
        // El formato de filePath es "directory/fileId"
        const fileId = filePath.split('/')[1];
        const fileData = await getFile(fileId);
        setFile(fileData);
      } catch (err) {
        console.error('Error al cargar el archivo:', err);
        setError('No se pudo cargar el archivo');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [filePath]);

  if (loading) return <div className="file-viewer-loading">Cargando archivo...</div>;
  if (error) return <div className="file-viewer-error">{error}</div>;
  if (!file) return <div className="file-viewer-empty">No hay archivo para mostrar</div>;

  // Generar una URL para mostrar el archivo
  const fileUrl = URL.createObjectURL(new Blob([file.data], { type: file.type }));

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <h3>{file.name}</h3>
        <a href={fileUrl} download={file.name} className="download-button">
          Descargar
        </a>
      </div>
      
      {file.type.startsWith('image/') ? (
        <img src={fileUrl} alt={file.name} className="file-preview" />
      ) : file.type === 'application/pdf' ? (
        <iframe src={fileUrl} title={file.name} className="pdf-preview" />
      ) : (
        <div className="file-unavailable">
          Vista previa no disponible para este tipo de archivo. Haga clic en Descargar.
        </div>
      )}
    </div>
  );
};

export default FileViewer;
