// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier, LotClass, LotStatus} from "../src/Types.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {ScaleReading, RecoveryConsent, DestructionCertificate} from "../src/Attestations.sol";

/// @notice Independent second parties (threats T1, T14, T15) and cylinder uniqueness.
///         A service company's own scale is not enough to book gas as recovered, and a
///         destruction facility cannot certify its own destruction.
contract ProvenanceTest is Fixture {
    // ================================================================ H1: recovery needs the unit owner's consent

    function test_H1_recoveryRecordsOwnerConsent() public {
        uint256 lotId = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        assertEq(ledger.getLot(lotId).origin, EQ_A);
        assertEq(uint8(ledger.getLot(lotId).tier), uint8(Tier.A));
    }

    /// The attack the audit found: a technician books smuggled virgin gas as "recovered" from a
    /// registered unit they have no business with, using only their own (genuine) scale.
    function test_H1_revert_consentSignedByServiceCompany() public {
        bytes32 cyl = bytes32("cyl");
        RecoveryConsent memory c = _consent(EQ_A, cyl, service, 8_000, true);
        bytes memory forged = _signConsent(SCALE_SERVICE_PK, c); // the service company's own key
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 8_000);
        bytes memory rs = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotUnitOwner.selector, vm.addr(SCALE_SERVICE_PK)));
        ledger.recover(c, forged, r, rs);
    }

    function test_H1_revert_consentFromAnotherOwner() public {
        // the take-back point is a registered owner, but not of this unit
        bytes32 cyl = bytes32("cyl");
        RecoveryConsent memory c = _consent(EQ_A, cyl, service, 8_000, true);
        bytes memory cs = _signConsent(TAKEBACK_PK, c);
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 8_000);
        bytes memory rs = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotUnitOwner.selector, vm.addr(TAKEBACK_PK)));
        ledger.recover(c, cs, r, rs);
    }

    function test_H1_revert_consentNamesAnotherServiceCompany() public {
        bytes32 cyl = bytes32("cyl");
        RecoveryConsent memory c = _consent(EQ_A, cyl, service2, 8_000, true); // owner hired service2
        bytes memory cs = _ownerSigned(c);
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 8_000);
        bytes memory rs = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(KigaliLedger.ConsentMismatch.selector);
        ledger.recover(c, cs, r, rs);
    }

    function test_H1_revert_weightDiffersFromConsent() public {
        bytes32 cyl = bytes32("cyl");
        (RecoveryConsent memory c, bytes memory cs) = _ownerConsentFor(EQ_A, cyl, 4_000, true);
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 9_000); // books more than witnessed
        bytes memory rs = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(KigaliLedger.ConsentMismatch.selector);
        ledger.recover(c, cs, r, rs);
    }

    function test_H1_revert_consentCannotBeReplayed() public {
        (RecoveryConsent memory c, bytes memory cs) = _ownerConsentFor(EQ_A, bytes32("cyl-1"), 3_000, false);
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, bytes32("cyl-1")), 3_000);
        bytes memory rs = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        ledger.recover(c, cs, r, rs);

        // a fresh scale reading cannot reuse the owner's one-time consent for a second booking
        ScaleReading memory r2 = _reading(ledger.recoverySubject(EQ_A, bytes32("cyl-1")), 3_000);
        bytes memory rs2 = _signScale(SCALE_SERVICE_PK, r2);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NonceReused.selector, vm.addr(OWNER_PK), c.nonce));
        ledger.recover(c, cs, r2, rs2);
    }

    function test_H1_revert_revokedOwnerCannotConsent() public {
        identity.revokeRole(vm.addr(OWNER_PK), Roles.EQUIPMENT_OWNER, keccak256("operator licence withdrawn"));
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("cyl"), 8_000, true);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotUnitOwner.selector, vm.addr(OWNER_PK)));
        ledger.recover(c, cs, r, rs);
    }

    function test_H1_revert_ownerMustBeIndependentOfServiceCompany() public {
        // a unit whose registered owner key is bound to the service company itself
        // (e.g. its own workshop freezer): the consent is then not from an independent party
        _grant(vm.addr(0xC0FFEE), Roles.EQUIPMENT_OWNER);
        ledger.bindDevice(vm.addr(0xC0FFEE), service);
        bytes32 own2 = keccak256("service-company-own-freezer");
        vm.prank(registrar);
        equipment.registerTierA(own2, R404A, 5_000, INSTALLED_LONG_AGO, bytes32("rec2"), vm.addr(0xC0FFEE));
        RecoveryConsent memory c = _consent(own2, bytes32("cyl"), service, 4_000, true);
        bytes memory cs = _signConsent(0xC0FFEE, c);
        ScaleReading memory r = _reading(ledger.recoverySubject(own2, bytes32("cyl")), 4_000);
        bytes memory rs = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.OwnerNotIndependent.selector, vm.addr(0xC0FFEE)));
        ledger.recover(c, cs, r, rs);
    }

    // ================================================================ H4: destruction certified by an independent verifier

    function _atFacility(uint64 grams) internal returns (uint256) {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, grams, true);
        return _move(rec, service, facility, SCALE_FACILITY_PK, grams);
    }

    function test_H4_destructionCarriesVerifierCertificate() public {
        uint256 lotId = _atFacility(8_000);
        uint256 ev = _destroy(_one(lotId), 8_000);
        assertEq(claims.destructionEvent(ev).dreBps, 9_999);
        assertEq(
            claims.destructionEvent(ev).certificateHash,
            keccak256(abi.encode("destruction-certificate", ledger.destructionSubject(_one(lotId))))
        );
    }

    function test_H4_revert_facilitySignsItsOwnCertificate() public {
        uint256[] memory inputs = _one(_atFacility(8_000));
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, 8_000);
        bytes memory rs = _signScale(SCALE_FACILITY_PK, r);
        DestructionCertificate memory d = _destCert(subject, 8_000, 9_999);
        bytes memory ds = _signDestruction(SCALE_FACILITY_PK, d); // the facility's own scale key
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotVerifier.selector, vm.addr(SCALE_FACILITY_PK)));
        ledger.destroy(inputs, r, rs, d, ds);
    }

    function test_H4_revert_verifierBoundToFacilityIsNotIndependent() public {
        ledger.bindDevice(vm.addr(VERIFIER_PK), facility); // the verifier turns out to be the facility's in-house team
        uint256[] memory inputs = _one(_atFacility(8_000));
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, 8_000);
        bytes memory rs = _signScale(SCALE_FACILITY_PK, r);
        DestructionCertificate memory d = _destCert(subject, 8_000, 9_999);
        bytes memory ds = _signDestruction(VERIFIER_PK, d);
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.VerifierNotIndependent.selector, vm.addr(VERIFIER_PK)));
        ledger.destroy(inputs, r, rs, d, ds);
    }

    function test_H4_revert_certifiedQuantityDiffersFromIntake() public {
        uint256[] memory inputs = _one(_atFacility(8_000));
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, 8_000);
        bytes memory rs = _signScale(SCALE_FACILITY_PK, r);
        DestructionCertificate memory d = _destCert(subject, 7_000, 9_999); // verifier saw 7 kg destroyed
        bytes memory ds = _signDestruction(VERIFIER_PK, d);
        vm.prank(facility);
        vm.expectRevert(KigaliLedger.CertificateMismatch.selector);
        ledger.destroy(inputs, r, rs, d, ds);
    }

    function test_H4_revert_certificateForOtherInputs() public {
        uint256 a = _atFacility(4_000);
        uint256[] memory inputs = _one(a);
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, 4_000);
        bytes memory rs = _signScale(SCALE_FACILITY_PK, r);
        DestructionCertificate memory d = _destCert(ledger.destructionSubject(_one(a + 100)), 4_000, 9_999);
        bytes memory ds = _signDestruction(VERIFIER_PK, d);
        vm.prank(facility);
        vm.expectRevert(KigaliLedger.WrongSubject.selector);
        ledger.destroy(inputs, r, rs, d, ds);
    }

    // ================================================================ M1: one open lot per cylinder

    function test_M1_revert_cylinderCannotBackTwoLots() public {
        vm.prank(importer);
        ledger.mintVirgin(QUOTA_ID, 10_000, bytes32("cylinder-42"));
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.CylinderInUse.selector, bytes32("cylinder-42")));
        ledger.mintVirgin(QUOTA_ID, 10_000, bytes32("cylinder-42"));
    }

    function test_M1_revert_recoveryIntoAnOccupiedCylinder() public {
        vm.prank(importer);
        uint256 v = ledger.mintVirgin(QUOTA_ID, 10_000, bytes32("cylinder-42"));
        _move(v, importer, service, SCALE_SERVICE_PK, 10_000); // the full virgin cylinder now sits at the service company
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("cylinder-42"), 8_000, true);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.CylinderInUse.selector, bytes32("cylinder-42")));
        ledger.recover(c, cs, r, rs);
    }

    function test_M1_cylinderIsFreedWhenItsLotCloses() public {
        uint256 lotId = _atFacility(8_000);
        bytes32 cyl = ledger.getLot(lotId).cylinderId;
        assertEq(ledger.openLotsInCylinder(cyl), 1);
        _destroy(_one(lotId), 8_000);
        assertEq(ledger.openLotsInCylinder(cyl), 0);
        assertEq(uint8(ledger.getLot(lotId).status), uint8(LotStatus.CONSUMED));
    }

    function test_M1_splitRecoverySharesOneCylinder() public {
        // a top-up 60 days before end of life: part of the cylinder is quarantined Tier C
        vm.prank(importer);
        uint256 v = ledger.mintVirgin(QUOTA_ID, 1_000, bytes32("topup-cyl"));
        _move(v, importer, service, SCALE_SERVICE_PK, 1_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 1_000);
        vm.warp(block.timestamp + 60 days);
        (uint256 inService, uint256 quarantined) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 9_000);
        bytes32 cyl = ledger.getLot(inService).cylinderId;
        assertEq(ledger.getLot(quarantined).cylinderId, cyl);
        assertEq(ledger.openLotsInCylinder(cyl), 2);
    }

    function test_M1_revert_zeroCylinder() public {
        vm.prank(importer);
        vm.expectRevert(KigaliLedger.ZeroCylinder.selector);
        ledger.mintVirgin(QUOTA_ID, 1_000, bytes32(0));
    }

    function test_M1_splitSendNeedsAnEmptyCylinder() public {
        vm.prank(importer);
        uint256 a = ledger.mintVirgin(QUOTA_ID, 5_000, bytes32("cyl-a"));
        vm.prank(importer);
        ledger.mintVirgin(QUOTA_ID, 5_000, bytes32("cyl-b"));
        // decanting part of lot A into cylinder B, which is still full, is refused
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.CylinderInUse.selector, bytes32("cyl-b")));
        ledger.send(a, distributor, 1_000, bytes32("cyl-b"));
    }
}
