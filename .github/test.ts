import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { getOctokit } from '@actions/github'

const octokit = getOctokit("some-token");
const url = restEndpointMethods(octokit).rest.users.getByUsername.endpoint.DEFAULTS
console.log(url) // => /repos/{owner}/{repo}/issues/{issue_number}/comments