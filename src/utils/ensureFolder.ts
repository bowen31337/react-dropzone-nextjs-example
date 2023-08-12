import fs from "fs";

function ensureFolderExists(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log("Folder created:", folderPath);
    } catch (err) {
      console.error("Error creating folder:", err);
    }
  } else {
    console.log("Folder already exists:", folderPath);
  }
}

export { ensureFolderExists };
