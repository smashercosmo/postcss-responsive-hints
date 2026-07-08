import type { CommitFunctions } from "@changesets/types";
import commitFunctions from "@changesets/cli/commit";

const { getAddMessage, getVersionMessage } = commitFunctions;

const functions: CommitFunctions = {
  async getAddMessage(...args) {
    return getAddMessage(...args);
  },
  async getVersionMessage(...args) {
    return getVersionMessage(...args);
  },
};

export default functions;
