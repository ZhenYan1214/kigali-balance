#!/usr/bin/env bash
# Put one refused transaction on OP Sepolia as public evidence of the failure path:
# the International registry tries to claim destruction event 0, which the Taiwan registry
# already claimed, and the contract reverts with AlreadyClaimed. The transaction is sent with a
# fixed gas limit so it is mined (status 0) instead of being stopped by gas estimation.
#
#   bash script/refused_claim_op_sepolia.sh --check   # derive the key and check its address only
#   bash script/refused_claim_op_sepolia.sh           # fund the registry with test ETH, then send
#
# Keys come from .env and are never printed. The International registry's key is derived from the
# deployer key exactly as in Deploy.s.sol (_actor("registry-international")).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

RPC="$OP_SEPOLIA_RPC_URL"
CLAIMS=$(python -c "import json;print(json.load(open('deployments/11155420.json'))['DestructionClaims'])")
INTL=$(python -c "import json;print(json.load(open('deployments/11155420.json'))['registryInternational'])")
SECP_N=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

deployer_pk="0x${DEPLOYER_PRIVATE_KEY#0x}"
digest=$(cast keccak "$(cast abi-encode 'f(uint256,string,string)' "$deployer_pk" kigali-balance-demo registry-international)")
intl_pk=$(python -c "import sys; h, n = int(sys.argv[1], 16), int(sys.argv[2], 16); print(hex(h % (n - 1) + 1))" "$digest" "$SECP_N")
derived=$(cast wallet address --private-key "$intl_pk")
if [ "${derived,,}" != "${INTL,,}" ]; then
  echo "derived address $derived does not match registryInternational $INTL" >&2
  exit 1
fi
echo "International registry key matches $INTL"
dry=$(cast call "$CLAIMS" 'claim(uint256,bytes32)' 0 "$(cast format-bytes32-string INTL-HFC-0042)" \
  --from "$INTL" --rpc-url "$RPC" 2>&1 || true)
case "$dry" in
  *0x2058b6db*) echo "dry run reverts with AlreadyClaimed, as intended" ;;
  *) echo "dry run did not revert with AlreadyClaimed; not sending: $dry" >&2; exit 1 ;;
esac
[ "${1:-}" = "--check" ] && exit 0

cast send "$INTL" --value 0.00005ether --private-key "$deployer_pk" --rpc-url "$RPC" | grep -E '^(status|transactionHash)'
cast send "$CLAIMS" 'claim(uint256,bytes32)' 0 "$(cast format-bytes32-string INTL-HFC-0042)" \
  --gas-limit 150000 --private-key "$intl_pk" --rpc-url "$RPC" | grep -E '^(status|transactionHash)' || true
