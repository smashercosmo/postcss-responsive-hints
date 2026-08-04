import { createMiddleware } from "@mswjs/http-middleware";
import { http as mswHttp, HttpResponse } from "msw";
import http from "node:http";

const handlers = [
  mswHttp.get("*/repos/*/*/installation", () => {
    return HttpResponse.json(
      {
        app_slug: "some-app-slug",
        id: 12_345_678,
      },
      { headers: { "content-type": "application/json" }, status: 200 },
    );
  }),
  mswHttp.post("*/app/installations/*/access_tokens", () => {
    return HttpResponse.json(
      {
        expires_at: "2030-01-01T00:00:00Z",
        token: "ghs_16C7e42F292c6912E7710c838347Ae178B4a",
      },
      { headers: { "content-type": "application/json" }, status: 201 },
    );
  }),
];

const middleware = createMiddleware(...handlers);

export const server = http.createServer((req, res) => {
  // Polyfill Express req.get() for @mswjs/http-middleware
  // oxlint-disable-next-line typescript/no-explicit-any
  (req as any).get = (name: string) => req.headers[name.toLowerCase()];

  middleware(req, res, () => {
    res.statusCode = 404;
    res.end("Not Found");
  });
});
