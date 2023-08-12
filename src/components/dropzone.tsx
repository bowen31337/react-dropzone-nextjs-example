import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios, { AxiosRequestConfig } from "axios";

const CHUNK_SIZE = 20* 1024 * 1024; // 20MB

// axios.interceptors.response.use(undefined, (err) => {
//   const { config, message } = err ;
//   if (!config || !config.retry) {
//     return Promise.reject(err);
//   }
//   // retry while Network timeout or Network Error
//   if (!(message.includes("timeout") || message.includes("Network Error"))) {
//     return Promise.reject(err);
//   }
//   config.retry -= 1;
//   const delayRetryRequest = new Promise<any,any>((resolve) => {
//     setTimeout(() => {
//       console.log("retry the request", config.url);
//       resolve();
//     }, config.retryDelay || 1000);
//   });
//   return delayRetryRequest.then(() => axios(config));
// });

// when request, can set retry times and retry delay time

const FileUploadWithProgress: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);

  const uploadChunk = async (file: File, chunkNumber: number) => {
    const startByte = chunkNumber * CHUNK_SIZE;
    const endByte = Math.min((chunkNumber + 1) * CHUNK_SIZE, file.size);

    const chunkBlob = file.slice(startByte, endByte);
    const formData = new FormData();
    formData.append("fileChunk", chunkBlob, `${file.name}.${chunkNumber}`);

    const config: AxiosRequestConfig = {
      onUploadProgress: (progressEvent) => {
        const percentage = Math.round(
          (progressEvent.loaded * 100 * endByte) /
            (progressEvent.total * file.size)
        );
        setProgress(percentage);
      },
    };

    try {
      await axios.post(`/api/upload?chunk=${chunkNumber}`, formData, config);
    } catch (error) {
      console.error("Error uploading chunk:", error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let fileName = ''
    const chunkPromises = acceptedFiles.map(async (file) => {
      console.log(file.size);
      fileName = file.name;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      console.log(totalChunks);

      return [...new Array(totalChunks)].reduce(async (acc,curr,chunkNumber)=> {
        await acc;
        return uploadChunk(file,chunkNumber)
      }, Promise.resolve())
    });

    try {
      await Promise.all(chunkPromises);
      console.log("Files uploaded successfully!");
      // setProgress(0);
      console.log('merging chunks');
      await axios.get(`/api/merge?fileName=${fileName}`);
    } catch (error) {
      console.error("Error uploading files:", error);
      setProgress(0);
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
        <p>Drag & drop files here or click to select files</p>
      </div>
      {progress > 0 && (
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
