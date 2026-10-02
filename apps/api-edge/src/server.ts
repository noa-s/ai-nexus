import { createServer } from "node:http";
import { requireAuthorization } from "./auth/middleware.js";

export const server = createServer((request, response) => {
  if (request.url === "/health" && request.method === "GET") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "api-edge" }));
    return;
  }

  if (request.url === "/protected" && request.method === "GET") {
    if (!requireAuthorization(request, response, "resource.read", "protected-resource")) return;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "api-edge", protected: true }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, "0.0.0.0");
}
