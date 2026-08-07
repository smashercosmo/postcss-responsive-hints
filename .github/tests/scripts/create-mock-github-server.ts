import type {
  EndpointDefaults,
  GetResponseDataTypeFromEndpointMethod,
} from "@octokit/types";
import type { OmitIndexSignature } from "type-fest";

import { getOctokit } from "@actions/github";
import { createMiddleware } from "@mswjs/http-middleware";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { createProxyServer } from "http-proxy";
import {
  type DefaultBodyType,
  http,
  HttpResponse,
  type StrictRequest,
} from "msw";
import { createServer } from "node:http";

function toLowerCase<TString extends string>(str: TString) {
  return str.toLowerCase() as Lowercase<typeof str>;
}

const octokit = getOctokit("whatever-token");
const api = restEndpointMethods(octokit);

// oxlint-disable-next-line typescript/no-explicit-any -- that's the only way to make AnyFunction type
type Endpoint = ((...args: Array<any>) => any) & {
  endpoint: { DEFAULTS: EndpointDefaults };
};

type ResponseData<TEndpoint extends Endpoint> =
  GetResponseDataTypeFromEndpointMethod<TEndpoint> extends Array<infer TItem>
    ? Array<Partial<OmitIndexSignature<TItem>>>
    : Partial<
        OmitIndexSignature<GetResponseDataTypeFromEndpointMethod<TEndpoint>>
      >;

type RequestParams<TEndpoint extends Endpoint> = Parameters<TEndpoint>[0];

type Response<TEndpoint extends Endpoint> =
  | ResponseData<TEndpoint>
  | ((req: RequestParams<TEndpoint>) => ResponseData<TEndpoint>);

async function getRequestBody(request: StrictRequest<DefaultBodyType>) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      return [await request.clone().json()];
    } catch {
      return [];
    }
  } else {
    return [];
  }
}

function octokitEndpointMethodToMswHandler<TEndpoint extends Endpoint>({
  handler,
  response,
  status = 200,
}: {
  handler: TEndpoint;
  response: Response<TEndpoint> | undefined;
  status?: number;
}) {
  if (
    !handler.endpoint.DEFAULTS ||
    typeof handler.endpoint.DEFAULTS.url !== "string" ||
    typeof handler.endpoint.DEFAULTS.method !== "string"
  ) {
    throw new TypeError(
      `Impossible to extract endpoint URL or method from the provided endpoint method.`,
    );
  }

  const { method: METHOD, url } = handler.endpoint.DEFAULTS;
  const patternPath = url.replaceAll(/\{([^}]+)}/g, ":$1");

  return http[toLowerCase(METHOD)](`*${patternPath}`, ({ params, request }) => {
    console.info("MOCK", request.method, new URL(request.url).pathname);
    return HttpResponse.json(
      typeof response === "function"
        ? response({
            ...params,
            ...Object.fromEntries(new URL(request.url).searchParams.entries()),
            ...getRequestBody(request),
          })
        : response,
      { status },
    );
  });
}

const handlers = [
  octokitEndpointMethodToMswHandler({
    handler: api.rest.users.getByUsername,
    response: {
      id: 12_345_678,
    },
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.apps.getRepoInstallation,
    response: {
      app_slug: "some-app-slug",
      id: 87_654_321,
    },
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.apps.createInstallationAccessToken,
    response: req => {
      return {
        expires_at: "2030-01-01T00:00:00Z",
        permissions: req?.permissions ?? {},
        token: "ghs_16C7e42F292c6912E7710c838347Ae178B4a",
      };
    },
    status: 201,
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.apps.revokeInstallationAccessToken,
    response: undefined,
    status: 204,
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.issues.createComment,
    response: {
      body: "Whatever you say",
    },
    status: 201,
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.pulls.list,
    response: [
      {
        html_url:
          "https://github.com/smashercosmo/postcss-responsive-hints/pull/1347",
        number: 1347,
      },
    ],
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.pulls.create,
    response: {
      html_url:
        "https://github.com/smashercosmo/postcss-responsive-hints/pull/43",
      number: 43,
      state: "open",
      title: "New PR Title",
    },
    status: 201,
  }),
  octokitEndpointMethodToMswHandler({
    handler: api.rest.pulls.update,
    response: {
      html_url:
        "https://github.com/smashercosmo/postcss-responsive-hints/pull/43",
      number: 43,
      state: "closed",
      title: "Updated Pull Request Title",
    },
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
