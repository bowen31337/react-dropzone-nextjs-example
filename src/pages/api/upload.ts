import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { ensureFolderExists } from "@/utils/ensureFolder";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadApi = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST" && req.url?.includes("/api/upload")) {
    const chunkNumber = Number(req.query.chunk);
    const form = formidable({
      maxFileSize: 200 * 1024 * 1024 * 1024, // 200GB in bytes
      uploadDir: "./public/uploads/temp", // The folder must exist
      keepExtensions: true,
      multiples: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing the form:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const fileChunks = files.fileChunk as formidable.File[];

      const chunkPromises = fileChunks.map((fileChunk) => {
        const filePartials = fileChunk.originalFilename?.split(".");
        const index = Number(filePartials?.pop());
        const fileName = filePartials?.join(".");

        // Usage
        const newFilePath = path.join(
          `./public/uploads/chunks_${fileName}`,
          fileChunk.originalFilename as string
        );
        ensureFolderExists(`./public/uploads/chunks_${fileName}`);

        const writeStream = fs.createWriteStream(newFilePath);

        const readStream = fs.createReadStream(fileChunk.filepath);

        return new Promise<void>((resolve, reject) => {
          readStream.pipe(writeStream);
          console.log(fileChunk.filepath);
          readStream.on("end", () => {
            fs.unlink(fileChunk.filepath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error deleting temporary file:", unlinkErr);
              }
            });
            resolve();
            return res.status(200).json({
              message: `${fileChunk.originalFilename} uploaded successfully`,
            });
          });

          readStream.on("error", (error) => reject(error));
        });
      });

      try {
        await Promise.all(chunkPromises);
        console.log("finished");
        // return res.status(200).json({ message: 'Chunks uploaded successfully' });
      } catch (error) {
        console.error("Error moving the Chunks:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } else {
    return res.status(405).end(); // Method Not Allowed
  }
};

export default uploadApi;
