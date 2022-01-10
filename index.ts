import { unbuiltExport } from "git-package";

const test: boolean = unbuiltExport;
if (!test) {
  throw new Error("Unexpected error, this should never happen");
}
