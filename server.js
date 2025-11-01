const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Static file serving for uploads
      if (pathname && (pathname.startsWith("/uploads/") || pathname.startsWith("/api/uploads/"))) {
        const relativePath = pathname.replace(/^\/api\//, '/');
        const filePath = path.join(process.cwd(), "public", relativePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
          try {
            const stat = fs.statSync(filePath);
            const stream = fs.createReadStream(filePath);
            
            // Set appropriate content type
            const contentTypes = {
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".png": "image/png",
              ".gif": "image/gif",
              ".webp": "image/webp",
              ".svg": "image/svg+xml",
            };
            
            const contentType = contentTypes[ext] || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Length", stat.size);
            
            stream.on("error", (err) => {
              console.error("Stream error:", err);
              res.statusCode = 500;
              res.end("Error reading file");
            });
            
            stream.pipe(res);
            return;
          } catch (err) {
            console.error("Error serving file:", err);
            res.statusCode = 500;
            res.end("Error serving file");
            return;
          }
        }
      }

      if (pathname === "/a") {
        await app.render(req, res, "/a", query);
      } else if (pathname === "/b") {
        await app.render(req, res, "/b", query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

