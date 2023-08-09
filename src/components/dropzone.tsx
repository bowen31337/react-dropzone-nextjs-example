"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios, { AxiosRequestConfig } from "axios";

const FileUploadWithProgress: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const formData = new FormData();

    console.log(acceptedFiles)

    for (const file of acceptedFiles) {
      formData.append("files", file);
    }

    const config: AxiosRequestConfig = {
      onUploadProgress: (progressEvent) => {
        console.log(progressEvent)
        const percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent?.total
        );
        setProgress(percentage);
      },
      timeout: 3000000,
    };

    try {
      setUploading(true);
      // Replace '/api/upload' with the correct API route path you defined in upload.ts
      await axios.post("/api/upload", formData, config);

      console.log("File uploaded successfully!");
      setProgress(0); // Reset the progress after successful upload
      setUploading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setProgress(0); // Reset the progress on error
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 200 * 1024 * 1024 * 1024, // 200GB in bytes
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        <p>Drag & drop your files here or click to select files</p>
      </div>
      {uploading && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadWithProgress;
