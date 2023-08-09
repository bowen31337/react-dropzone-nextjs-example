import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadApi = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  const form = formidable({
    maxFileSize: 200 * 1024 * 1024 * 1024, // 200GB in bytes
    uploadDir: "./public/uploads", // The folder must exist
    keepExtensions: true, // If true, the uploaded file will have the same extension as the original file
  });

  // Listen for the 'progress' event to get accurate progress updates
  form.on("progress", (bytesReceived, bytesExpected) => {
    const percentage = (bytesReceived / bytesExpected) * 100;
    console.log("Upload progress:", percentage, "%");
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing the form:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const uploadedFiles = files.files as formidable.File[];

    const filePromises = uploadedFiles.map(async (uploadedFile) => {
      const tempFilePath = uploadedFile.filepath;
      const newFileName = `${Date.now()}-${uploadedFile.originalFilename}`;
      const newFilePath = `./public/uploads/${newFileName}`;


      const readStream = fs.createReadStream(tempFilePath);
      const writeStream = fs.createWriteStream(newFilePath);

      await new Promise<void>((resolve, reject) => {
        readStream.pipe(writeStream);
        readStream.on('end', () => resolve());
        readStream.on('error', (error) => reject(error));
      });

      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary file:', unlinkErr);
        }
      });
    });

    try {
      await Promise.all(filePromises);
      return res.status(200).json({ message: 'Files uploaded successfully' });
    } catch (error) {
      console.error('Error moving the files:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });



};

export default uploadApi;
