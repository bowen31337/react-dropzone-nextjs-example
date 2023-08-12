import type { NextApiRequest, NextApiResponse } from "next";
import fs, { WriteStream } from "fs";
import { ensureFolderExists } from "@/utils/ensureFolder";
import path from "path";
const CHUNK_SIZE = 20*1024 * 1024; // 1MB

const mergeApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const fileName = req.query.fileName;

  if (!fileName) {
    return res.status(500).json({ message: "file name is missing" });
  }
  const chunkDir = `./public/uploads/chunks_${fileName}`;
  ensureFolderExists(chunkDir);

  const chunkPaths = fs
    .readdirSync(chunkDir)
    .filter((path) => !path.includes(".DS_Store"));

  const fileSavedFolder = `./public/uploads/${new Date()
    .toLocaleDateString()
    .replace(/\//g, "-")}`;
  const newFilePath = path.join(fileSavedFolder, fileName as string);

  ensureFolderExists(fileSavedFolder);

  const chunkPromises = chunkPaths.map((chunkPath) => {
    const filePartials = chunkPath.split(".");
    const index = Number(filePartials.pop());

    const chunkFilePath = path.join(
      `./public/uploads/chunks_${fileName}`,
      chunkPath
    );

    const readStream = fs.createReadStream(chunkFilePath);

    const writeStream = fs.createWriteStream(newFilePath, {
      start: index * CHUNK_SIZE,
    });

    readStream.pipe(writeStream);

    return new Promise<void>((resolve, reject) => {
      readStream.on("end", () => {
        fs.unlink(chunkFilePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting temporary file:", unlinkErr);
          }
        });
        resolve();
      });

      readStream.on("error", (error) => reject(error));
    });
  });

  try {
    await Promise.all(chunkPromises);
    console.log("merge finished");
    fs.rmdir(`./public/uploads/chunks_${fileName}`, (e) => e && console.log(e));
    return res.status(200).json({ message: "Chunks merged successfully" });
  } catch (error) {
    console.error("Error moving the Chunks:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default mergeApi;
