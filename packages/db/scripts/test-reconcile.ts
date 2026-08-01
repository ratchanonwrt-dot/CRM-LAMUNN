import { reconcileVoidedBills } from "../src/posBills";
async function main() {
  const result = await reconcileVoidedBills();
  console.log(result);
}
main();
