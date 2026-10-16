#!/usr/bin/env bash
# Check a filled-in .env for the OP Sepolia deployment without ever printing a secret value.
#
#   bash script/check_env.sh            # reads ./.env from the repository root
#
# Prints whether each variable is set and well formed, whether the RPC answers on chain 11155420,
# the deployer's address, balance and transaction count, and whether Etherscan accepts the key.
# Read-only: sends no transaction.
set -u
cd "$(dirname "$0")/.."
envfile="${1:-.env}"
[[ -f "$envfile" ]] || { echo "no $envfile (copy .env.example to .env and fill it in)"; exit 1; }

# load, tolerating Windows line endings and surrounding quotes
while IFS='=' read -r key value; do
  key="${key//$'\r'/}"; value="${value//$'\r'/}"
  [[ -z "$key" || "$key" == \#* ]] && continue
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  value="${value#"${value%%[![:space:]]*}"}"; value="${value%"${value##*[![:space:]]}"}"
  export "$key=$value"
done < "$envfile"

say() { printf '%-24s %s\n' "$1" "$2"; }
host() { printf '%s' "$1" | sed -E 's#^https?://([^/]+).*#\1#'; }

# 1) presence and format (an RPC URL may embed an API key: only its host is printed)
if [[ -n "${OP_SEPOLIA_RPC_URL:-}" ]]; then say OP_SEPOLIA_RPC_URL "set, host $(host "$OP_SEPOLIA_RPC_URL")"; else say OP_SEPOLIA_RPC_URL "EMPTY"; fi
if [[ -n "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  k="${DEPLOYER_PRIVATE_KEY#0x}"
  if [[ "$k" =~ ^[0-9a-fA-F]{64}$ ]]; then say DEPLOYER_PRIVATE_KEY "set (64 hex$( [[ "$DEPLOYER_PRIVATE_KEY" == 0x* ]] || echo ', missing 0x prefix'))"
  else say DEPLOYER_PRIVATE_KEY "set but NOT 64 hex characters (length ${#k})"; fi
else say DEPLOYER_PRIVATE_KEY "EMPTY"; fi
if [[ -n "${ETHERSCAN_API_KEY:-}" ]]; then say ETHERSCAN_API_KEY "set (length ${#ETHERSCAN_API_KEY})"; else say ETHERSCAN_API_KEY "EMPTY"; fi

# 2) RPC
if [[ -n "${OP_SEPOLIA_RPC_URL:-}" ]]; then
  chain=$(cast chain-id --rpc-url "$OP_SEPOLIA_RPC_URL" 2>/dev/null)
  if [[ "$chain" == "11155420" ]]; then say RPC "reachable, chain id 11155420 (OP Sepolia)"; else say RPC "FAILED or wrong chain (got: ${chain:-no answer})"; fi
fi

# 3) wallet
addr=""
if [[ "${DEPLOYER_PRIVATE_KEY:-}" =~ ^(0x)?[0-9a-fA-F]{64}$ ]]; then
  pk="$DEPLOYER_PRIVATE_KEY"; [[ "$pk" == 0x* ]] || pk="0x$pk"
  addr=$(cast wallet address --private-key "$pk" 2>/dev/null)
  say "deployer address" "${addr:-could not derive}"
  if [[ -n "$addr" && -n "${OP_SEPOLIA_RPC_URL:-}" ]]; then
    say "deployer balance" "$(cast balance "$addr" --ether --rpc-url "$OP_SEPOLIA_RPC_URL" 2>/dev/null || echo ?) ETH"
    say "deployer tx count" "$(cast nonce "$addr" --rpc-url "$OP_SEPOLIA_RPC_URL" 2>/dev/null || echo ?)"
  fi
fi

# 4) Etherscan key (API v2 covers OP Sepolia)
if [[ -n "${ETHERSCAN_API_KEY:-}" && -n "$addr" ]]; then
  resp=$(curl -s --max-time 20 "https://api.etherscan.io/v2/api?chainid=11155420&module=account&action=balance&address=${addr}&tag=latest&apikey=${ETHERSCAN_API_KEY}")
  status=$(printf '%s' "$resp" | sed -n 's/.*"status":"\([0-9]\)".*/\1/p')
  message=$(printf '%s' "$resp" | sed -n 's/.*"message":"\([^"]*\)".*/\1/p')
  if [[ "$status" == "1" ]]; then say "Etherscan key" "valid (API answered OK for OP Sepolia)"; else say "Etherscan key" "REJECTED or unreachable (message: ${message:-none})"; fi
fi
