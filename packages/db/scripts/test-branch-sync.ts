import { syncBranchesFromPos } from "../src/posBranches";
async function main() {
  const result = await syncBranchesFromPos();
  console.log(result);
}
main();
