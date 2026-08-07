import type { EndpointDefaults, GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import { http, HttpResponse } from "msw";
import { getOctokit } from '@actions/github'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { type OmitIndexSignature } from "type-fest"

function toLowerCase<STR extends string>(str: STR) {
  return str.toLowerCase() as Lowercase<typeof str>;
}

const octokit = getOctokit("whatever-token");
const api = restEndpointMethods(octokit);

function oktokitEndpointMethodToMswHandler<
  TEndpoint extends ((...args: any[]) => any) & { endpoint: { DEFAULTS: EndpointDefaults }},
  TResponse extends Partial<OmitIndexSignature<GetResponseDataTypeFromEndpointMethod<TEndpoint>>,
>({ handler, response }: { handler: TEndpoint; response: TResponse }) {
  if (!handler.endpoint.DEFAULTS || typeof handler.endpoint.DEFAULTS.url !== "string" || typeof handler.endpoint.DEFAULTS.method !== "string") {
    throw new TypeError(
      `Impossible to extract endpoint URL or method from the provided endpoint method.`,
    );
  }

  const { method: METHOD, url } = handler.endpoint.DEFAULTS;
  const patternPath = url.replace(/\{([^}]+)}/g, ":$1");

  return http[toLowerCase(METHOD)](`*${patternPath}`, ({ request }) => {
    console.info("MOCK", request.method, new URL(request.url).pathname);
    return HttpResponse.json(response);
  });
}

const handlers = [
  oktokitEndpointMethodToMswHandler({
    handler: api.rest.users.getByUsername,
    response: {
      id: 1,
      sddsfsdf: "octocat",
    },
  }),
]
  http.get("*/repos/:owner/:repo/installation", ({ request }) => {
    console.info("MOCK", request.method, new URL(request.url).pathname);
    return HttpResponse.json({
      app_slug: "some-app-slug",
      id: 1,
    });
  }),
  http.post(
    "*/app/installations/:installation_id/access_tokens",
    ({ request }) => {
      console.info("MOCK", request.method, new URL(request.url).pathname);
      return HttpResponse.json(
        {
          expires_at: "2030-01-01T00:00:00Z",
          token: "ghs_16C7e42F292c6912E7710c838347Ae178B4a",
        },
        { status: 201 },
      );
    },
  ),
  http.delete("*/installation/token", ({ request }) => {
    console.info("MOCK", request.method, new URL(request.url).pathname);
    return HttpResponse.json(null, {
      headers: { "content-type": "application/json" },
      status: 204,
    });
  }),
  http.post(
    "*/repos/:owner/:repo/issues/:issue_number/comments",
    async ({ request }) => {
      console.info("MOCK", request.method, new URL(request.url).pathname);
      return HttpResponse.json(
        {
          body: await request.json(),
          id: 1,
        },
        { status: 201 },
      );
    },
  ),

  http.patch("*/repos/:owner/:repo/pulls/:pull_number", ({ request }) => {
    console.info("MOCK", request.method, new URL(request.url).pathname);
    return HttpResponse.json(
      {
        state: "closed",
      },
      { status: 200 },
    );
  }),
];

const middleware = createMiddleware(...handlers);

const proxy = createProxyServer({
  changeOrigin: true,
  secure: true,
});

export const server = createServer((req, res) => {
  // Required by @mswjs/http-middleware
  // oxlint-disable-next-line typescript/no-explicit-any
  (req as any).get = (name: string) => req.headers[name.toLowerCase()];

  middleware(req, res, () => {
    console.info("PROXY", req.method, req.url);

    proxy.web(req, res, {
      ignorePath: false,
      target: "https://api.github.com",
    });
  });
});
