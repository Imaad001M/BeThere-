import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };

await stat(path.join(root, "index.html")).catch(() => {
  throw new Error("Run npm run build before npm start.");
});

createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filename = path.resolve(root, "." + pathname, ...(pathname.endsWith("/") ? ["index.html"] : []));
    if (!filename.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(filename);
    res.writeHead(200, { "Content-Type": mime[path.extname(filename)] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`BeThere preview: http://127.0.0.1:${port}`));
