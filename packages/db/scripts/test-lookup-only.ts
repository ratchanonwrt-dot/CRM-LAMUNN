import { lookupPosBill } from "../src/posBills";
async function main() {
  console.log("known voided bill:", await lookupPosBill("ASOKE", "ASOKE-260719-172745719"));
  console.log("known completed bill:", await lookupPosBill("THAPHRA", "THAPHRA-260722-001501606"));
  console.log("nonexistent bill:", await lookupPosBill("THAPHRA", "DOES-NOT-EXIST"));
}
main();
