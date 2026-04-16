import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const htmlFiles = [
  "About.html",
  "Admin.html",
  "Cart.html",
  "Error.html",
  "Food.html",
  "index.html",
  "Login.html",
  "Movies.html",
  "Orderhistory.html",
  "Payment.html",
  "product-details.html",
  "Product.html",
  "Profile.html",
  "success.html",
  "Ticketview.html"
];

const folders = ["Assests", "uploads"];
const docs = ["README.md", "DEPLOY.md"];

function copyFileIfExists(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectoryIfExists(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.cpSync(source, target, {
    recursive: true,
    force: true,
    filter: (filePath) => !filePath.includes(`${path.sep}node_modules${path.sep}`)
  });
}

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });

for (const fileName of htmlFiles) {
  copyFileIfExists(path.join(projectRoot, fileName), path.join(publicDir, fileName));
}

for (const folder of folders) {
  copyDirectoryIfExists(path.join(projectRoot, folder), path.join(publicDir, folder));
}

for (const fileName of docs) {
  copyFileIfExists(path.join(projectRoot, fileName), path.join(publicDir, fileName));
}

console.log("Prepared Vercel public assets.");
