import type { CommitFunctions } from "@changesets/types";
import commitFunctions from "@changesets/cli/commit";

const { getAddMessage, getVersionMessage } = commitFunctions;

const functions: CommitFunctions = {
  async getAddMessage(...args) {
    const msg = getAddMessage(...args);
    return msg;
  },
  async getVersionMessage(...args) {
    const msg = getVersionMessage(...args);
    return msg;
  },
};

export default functions;
