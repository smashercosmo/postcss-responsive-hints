import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it, expect } from "vitest";
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner';
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('PR check workflow', () => {
  it('should successfully run the workflow', async () => {
    const fixturesDir = join(__dirname, './__fixtures__');
    const workflowPath = join(__dirname, '../workflows/pr.yml');
    const workflowBody = readFileSync(workflowPath, 'utf8')

    const result = await new ActRunner()
    .withWorkflowBody(workflowBody)
    .withAdditionalArgs('--eventpath', join(fixturesDir, './events/pr.json'))
    .run();

    expect(result.status).toBe(ActExecStatus.SUCCESS);
  }, 120000);
});