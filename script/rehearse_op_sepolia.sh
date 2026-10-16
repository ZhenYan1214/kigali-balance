#!/usr/bin/env bash
# Rehearse script/Deploy.s.sol on a local fork of OP Sepolia before a real broadcast.
#
#   bash script/rehearse_op_sepolia.sh
#
# Nothing is sent to OP Sepolia: anvil forks the chain locally with chain id 31337, so no OP Sepolia
# record is written (deployments/31337.json is git-ignored). Prints the KigaliLedger deployment gas
# estimate on the fork, the script's step log, what the deployer spent, and the resulting state.
# Never prints RPC URLs or keys. Only the anvil process started here is stopped.
set -u
cd "$(dirname "$0")/.."
val() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '\r"'"'"' '; }
pk=$(val DEPLOYER_PRIVATE_KEY); url=$(val OP_SEPOLIA_RPC_URL)
[[ -n "$pk" && -n "$url" ]] || { echo "set DEPLOYER_PRIVATE_KEY and OP_SEPOLIA_RPC_URL in .env first (bash script/check_env.sh)"; exit 1; }
deployer=$(cast wallet address --private-key "$pk")
forge build >/dev/null

port=$((20000 + RANDOM % 20000)); rpc="http://127.0.0.1:$port"
anvil --port "$port" --fork-url "$url" --optimism --chain-id 31337 --silent &
apid=$!
trap 'kill $apid 2>/dev/null' EXIT
for _ in $(seq 1 150); do cast chain-id --rpc-url "$rpc" >/dev/null 2>&1 && break; sleep 0.2; done
echo "fork of OP Sepolia on port $port (local chain id $(cast chain-id --rpc-url "$rpc"))"
echo "deployer balance carried into the fork: $(cast balance "$deployer" --ether --rpc-url "$rpc") ETH"

# is the fork priced like the real chain? estimate the largest deployment through JSON-RPC
# (the init code is too long for a Windows command line, so it goes through a file)
body=$(mktemp)
node -e '
  const fs = require("fs");
  const code = JSON.parse(fs.readFileSync("out/KigaliLedger.sol/KigaliLedger.json", "utf8")).bytecode.object;
  const a = "0".repeat(63) + "1", b = "0".repeat(63) + "2";
  fs.writeFileSync(process.argv[1], JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_estimateGas",
    params: [{ from: process.argv[2], data: code + a + b + a + b }] }));
' "$body" "$deployer"
est=$(curl -s -X POST -H 'Content-Type: application/json' --data @"$body" "$rpc")
rm -f "$body"
echo "KigaliLedger deployment estimate on the fork: $(node -e 'const r = JSON.parse(process.argv[1]); console.log(r.result ? parseInt(r.result, 16) : JSON.stringify(r.error))' "$est")"

before=$(cast balance "$deployer" --rpc-url "$rpc")
out=$(forge script script/Deploy.s.sol --rpc-url "$rpc" --broadcast 2>&1)
printf '%s\n' "$out" | grep -vE '^\s*[│├└]' | grep -E 'gas price used|sent to demo|step|books|charged|Estimated|ONCHAIN|Error|error|written' | head -40
after=$(cast balance "$deployer" --rpc-url "$rpc")
echo "deployer spent on the fork (wei, incl. actor floats): $(node -e 'console.log((BigInt(process.argv[1]) - BigInt(process.argv[2])).toString())' "$before" "$after")"
echo "deployer transactions on the fork: $(cast nonce "$deployer" --rpc-url "$rpc")"

if [[ -f deployments/31337.json ]]; then
  L=$(node -e 'console.log(require("./deployments/31337.json").KigaliLedger)')
  C=$(node -e 'console.log(require("./deployments/31337.json").DestructionClaims)')
  echo "on-chain lotCount: $(cast call "$L" 'lotCount()(uint256)' --rpc-url "$rpc")"
  echo "on-chain destruction events: $(cast call "$C" 'eventCount()(uint256)' --rpc-url "$rpc")"
fi
