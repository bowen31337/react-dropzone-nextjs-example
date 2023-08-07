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
    maxFileSize: 1000 * 1024 * 1024, // 200MB in bytes
    uploadDir: "./public/uploads", // The folder must exist
    keepExtensions: true, // If true, the uploaded file will have the same extension as the original file
  });

  // Listen for the 'progress' event to get accurate progress updates
  form.on("progress", (bytesReceived, bytesExpected) => {
    const percentage = Math.round((bytesReceived / bytesExpected) * 100);
    console.log("Upload progress:", percentage, "%");
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing the form:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const uploadedFiles = files.files as formidable.File[];

    for (const uploadedFile of uploadedFiles) {
      // Get the temporary file path
      const tempFilePath = uploadedFile.filepath;

      // Generate a new file name (you can use other strategies to ensure unique filenames)
      const newFileName = `${Date.now()}-${uploadedFile.originalFilename}`;

      // Construct the new file path
      const newFilePath = `./public/uploads/${newFileName}`;
      fs.rename(tempFilePath, newFilePath, (renameErr) => {
        if (renameErr) {
          console.error("Error moving the file:", renameErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      });
    }
    return res.status(200).json({ message: "File uploaded successfully" });
  });
};

export default uploadApi;
