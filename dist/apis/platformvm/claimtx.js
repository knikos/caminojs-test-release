"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-ClaimTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const common_1 = require("../../common");
const credentials_1 = require("./credentials");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned ClaimTx transaction.
 */
class ClaimTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned RegisterNode transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param depositTxs Optional array of the deposit txids
     * @param claimableOwnerIDs Optional array of the claimable owner ids
     * @param claimedAmounts Optional array of the claimed amounts
     * @param claimTo Optional the owner of the rewards
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, depositTxs = undefined, claimableOwnerIDs = undefined, claimedAmounts = undefined, claimTo = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "ClaimTx";
        this._typeID = constants_1.PlatformVMConstants.CLAIMTX;
        this.numDepositTxs = buffer_1.Buffer.alloc(4);
        this.depositTxs = [];
        this.numClaimableOwnerIDs = buffer_1.Buffer.alloc(4);
        this.claimableOwnerIDs = [];
        this.numClaimedAmounts = buffer_1.Buffer.alloc(4);
        this.claimedAmounts = [];
        // Deposit rewards outputs will be minted to this owner, unless all of its fields has zero-values.
        // If it is empty, deposit rewards will be minted for depositTx.RewardsOwner.
        this.claimTo = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of claimableIn signers
        if (typeof depositTxs != "undefined") {
            this.numDepositTxs.writeUInt32BE(depositTxs.length, 0);
            const depositTxBufs = [];
            depositTxs.forEach((txID) => {
                if (typeof txID === "string") {
                    depositTxBufs.push(bintools.cb58Decode(txID));
                }
                else {
                    depositTxBufs.push(txID);
                }
            });
            this.depositTxs = depositTxBufs;
        }
        if (typeof claimableOwnerIDs != "undefined") {
            this.numClaimableOwnerIDs.writeUInt32BE(claimableOwnerIDs.length, 0);
            const claimableOwnerIDBufs = [];
            claimableOwnerIDs.forEach((ownerID) => {
                if (typeof ownerID === "string") {
                    claimableOwnerIDBufs.push(bintools.cb58Decode(ownerID));
                }
                else {
                    claimableOwnerIDBufs.push(ownerID);
                }
            });
            this.claimableOwnerIDs = claimableOwnerIDBufs;
        }
        if (typeof claimedAmounts != "undefined") {
            this.numClaimedAmounts.writeUInt32BE(claimedAmounts.length, 0);
            const claimedAmountBufs = [];
            claimedAmounts.forEach((amount) => {
                claimedAmountBufs.push(bintools.fromBNToBuffer(amount, 8));
            });
            this.claimedAmounts = claimedAmountBufs;
        }
        this.claimTo = claimTo;
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.depositTxs = fields["depositTxs"].map((txID) => serialization.decoder(txID, encoding, "cb58", "Buffer"));
        this.claimableOwnerIDs = fields["claimableOwnerIDs"].map((ownerID) => serialization.decoder(ownerID, encoding, "cb58", "Buffer"));
        this.claimedAmounts = fields["claimedAmounts"].map((amount) => serialization.decoder(amount, encoding, "decimalString", "Buffer"));
        this.claimTo.deserialize(fields["claimTo"], encoding);
        // initialize other num fields
        this.numDepositTxs = buffer_1.Buffer.alloc(4);
        this.numDepositTxs.writeUInt32BE(this.numDepositTxs.length, 0);
        this.numClaimableOwnerIDs = buffer_1.Buffer.alloc(4);
        this.numClaimableOwnerIDs.writeUInt32BE(this.numClaimableOwnerIDs.length, 0);
        this.numClaimedAmounts = buffer_1.Buffer.alloc(8);
        this.numClaimedAmounts.writeUIntBE(this.numClaimedAmounts.length, 0, 8);
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { depositTxs: this.depositTxs.map((txID) => serialization.encoder(txID, encoding, "Buffer", "cb58")), claimableOwnerIDs: this.claimableOwnerIDs.map((ownerID) => serialization.encoder(ownerID, encoding, "Buffer", "cb58")), claimedAmounts: this.claimedAmounts.map((amount) => serialization.encoder(amount, encoding, "Buffer", "decimalString")), claimTo: this.claimTo.serialize(encoding) });
    }
    /**
     * Returns the id of the [[RegisterNodeTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the array of claimed owner ids
     */
    getClaimableOwnerIDs() {
        return this.claimableOwnerIDs;
    }
    /**
     * Returns the array of claimed amounts
     */
    getClaimedAmounts() {
        return this.claimedAmounts;
    }
    /**
     * Returns the array of deposit tx ids
     */
    getDepositTxs() {
        return this.depositTxs;
    }
    /**
     * Returns the claimTo
     */
    getClaimTo() {
        return this.claimTo;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[ClaimTx]], parses it, populates the class, and returns the length of the [[ClaimTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ClaimTx]]
     *
     * @returns The length of the raw [[ClaimTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.numDepositTxs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const txCount = this.numDepositTxs.readUInt32BE(0);
        this.depositTxs = [];
        for (let i = 0; i < txCount; i++) {
            const txid = bintools.copyFrom(bytes, offset, offset + 32);
            offset += 32;
            this.depositTxs.push(txid);
        }
        this.numClaimableOwnerIDs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const ownerCount = this.numClaimableOwnerIDs.readUInt32BE(0);
        this.claimableOwnerIDs = [];
        for (let i = 0; i < ownerCount; i++) {
            const ownerid = bintools.copyFrom(bytes, offset, offset + 32);
            offset += 32;
            this.claimableOwnerIDs.push(ownerid);
        }
        this.numClaimedAmounts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const amountCount = this.numClaimedAmounts.readUInt32BE(0);
        this.claimedAmounts = [];
        for (let i = 0; i < amountCount; i++) {
            const amount = bintools.copyFrom(bytes, offset, offset + 8);
            offset += 8;
            this.claimedAmounts.push(amount);
        }
        offset += 4;
        offset = this.claimTo.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ClaimTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length;
        const barr = [superbuff];
        barr.push(this.numDepositTxs);
        bsize += this.numDepositTxs.length;
        this.depositTxs.forEach((depositTx) => {
            bsize += depositTx.length;
            barr.push(depositTx);
        });
        barr.push(this.numClaimableOwnerIDs);
        bsize += this.numClaimableOwnerIDs.length;
        this.claimableOwnerIDs.forEach((claimableOwnerID) => {
            barr.push(claimableOwnerID);
            bsize += claimableOwnerID.length;
        });
        barr.push(this.numClaimedAmounts);
        bsize += this.numClaimedAmounts.length;
        this.claimedAmounts.forEach((claimedAmount) => {
            barr.push(claimedAmount);
            bsize += claimedAmount.length;
        });
        barr.push(this.claimTo.toBuffer());
        bsize += this.claimTo.toBuffer().length;
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newClaimTx = new ClaimTx();
        newClaimTx.fromBuffer(this.toBuffer());
        return newClaimTx;
    }
    create(...args) {
        return new ClaimTx(...args);
    }
    /**
     * Creates and adds a [[SigIdx]] to the [[ClaimTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx, address) {
        const sigidx = new common_1.SigIdx();
        const b = buffer_1.Buffer.alloc(4);
        b.writeUInt32BE(addressIdx, 0);
        sigidx.fromBuffer(b);
        sigidx.setSource(address);
        this.sigIdxs.push(sigidx);
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    /**
     * Returns the array of [[SigIdx]] for this [[TX]]
     */
    getSigIdxs() {
        return this.sigIdxs;
    }
    /**
     * Set the array of [[SigIdx]] for this [[TX]]
     */
    setSigIdxs(sigIdxs) {
        this.sigIdxs = sigIdxs;
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const creds = super.sign(msg, kc);
        const sigidxs = this.getSigIdxs();
        const cred = (0, credentials_1.SelectCredentialClass)(constants_1.PlatformVMConstants.SECPCREDENTIAL);
        for (let i = 0; i < sigidxs.length; i++) {
            const keypair = kc.getKey(sigidxs[`${i}`].getSource());
            const signval = keypair.sign(msg);
            const sig = new common_1.Signature();
            sig.fromBuffer(signval);
            cred.addSignature(sig);
        }
        creds.push(cred);
        return creds;
    }
}
exports.ClaimTx = ClaimTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhaW10eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vY2xhaW10eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUFpRDtBQUdqRCxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELDZEQUE2RTtBQUU3RSx5Q0FBNEQ7QUFFNUQsK0NBQXFEO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsT0FBUSxTQUFRLGVBQU07SUEwTmpDOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsYUFBa0MsU0FBUyxFQUMzQyxvQkFBeUMsU0FBUyxFQUNsRCxpQkFBdUIsU0FBUyxFQUNoQyxVQUEyQixTQUFTO1FBRXBDLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFoUHZDLGNBQVMsR0FBRyxTQUFTLENBQUE7UUFDckIsWUFBTyxHQUFHLCtCQUFtQixDQUFDLE9BQU8sQ0FBQTtRQTJDckMsa0JBQWEsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZDLGVBQVUsR0FBYSxFQUFFLENBQUE7UUFFekIseUJBQW9CLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM5QyxzQkFBaUIsR0FBYSxFQUFF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QVUsRUFBRSxDQUFBO1FBQzNDLE1BQU0sSUFBSSxHQUFlLElBQUEsbUNBQXFCLEVBQzVDLCtCQUFtQixDQUFDLGNBQWMsQ0FDbkMsQ0FBQTtRQUNELEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQy9DLE1BQU0sT0FBTyxHQUFZLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1lBQy9ELE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDekMsTUFBTSxHQUFHLEdBQWMsSUFBSSxrQkFBUyxFQUFFLENBQUE7WUFDdEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3ZCO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7Q0FDRjtBQWpURCwwQkFpVEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1DbGFpbVR4XG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBQYXJzZWFibGVPdXRwdXQsIFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbCwgU2lnSWR4LCBTaWduYXR1cmUgfSBmcm9tIFwiLi4vLi4vY29tbW9uXCJcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSBcImNhbWlub2pzL2FwaXMvcGxhdGZvcm12bS9rZXljaGFpblwiXG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MgfSBmcm9tIFwiLi9jcmVkZW50aWFsc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIENsYWltVHggdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGFpbVR4IGV4dGVuZHMgQmFzZVR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQ2xhaW1UeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5DTEFJTVRYXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcblxuICAgIHRoaXMuZGVwb3NpdFR4cyA9IGZpZWxkc1tcImRlcG9zaXRUeHNcIl0ubWFwKCh0eElEOiBzdHJpbmcpID0+XG4gICAgICBzZXJpYWxpemF0aW9uLmRlY29kZXIodHhJRCwgZW5jb2RpbmcsIFwiY2I1OFwiLCBcIkJ1ZmZlclwiKVxuICAgIClcbiAgICB0aGlzLmNsYWltYWJsZU93bmVySURzID0gZmllbGRzW1wiY2xhaW1hYmxlT3duZXJJRHNcIl0ubWFwKFxuICAgICAgKG93bmVySUQ6IHN0cmluZykgPT5cbiAgICAgICAgc2VyaWFsaXphdGlvbi5kZWNvZGVyKG93bmVySUQsIGVuY29kaW5nLCBcImNiNThcIiwgXCJCdWZmZXJcIilcbiAgICApXG4gICAgdGhpcy5jbGFpbWVkQW1vdW50cyA9IGZpZWxkc1tcImNsYWltZWRBbW91bnRzXCJdLm1hcCgoYW1vdW50OiBzdHJpbmcpID0+XG4gICAgICBzZXJpYWxpemF0aW9uLmRlY29kZXIoYW1vdW50LCBlbmNvZGluZywgXCJkZWNpbWFsU3RyaW5nXCIsIFwiQnVmZmVyXCIpXG4gICAgKVxuICAgIHRoaXMuY2xhaW1Uby5kZXNlcmlhbGl6ZShmaWVsZHNbXCJjbGFpbVRvXCJdLCBlbmNvZGluZylcblxuICAgIC8vIGluaXRpYWxpemUgb3RoZXIgbnVtIGZpZWxkc1xuICAgIHRoaXMubnVtRGVwb3NpdFR4cyA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHRoaXMubnVtRGVwb3NpdFR4cy53cml0ZVVJbnQzMkJFKHRoaXMubnVtRGVwb3NpdFR4cy5sZW5ndGgsIDApXG4gICAgdGhpcy5udW1DbGFpbWFibGVPd25lcklEcyA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHRoaXMubnVtQ2xhaW1hYmxlT3duZXJJRHMud3JpdGVVSW50MzJCRSh0aGlzLm51bUNsYWltYWJsZU93bmVySURzLmxlbmd0aCwgMClcbiAgICB0aGlzLm51bUNsYWltZWRBbW91bnRzID0gQnVmZmVyLmFsbG9jKDgpXG4gICAgdGhpcy5udW1DbGFpbWVkQW1vdW50cy53cml0ZVVJbnRCRSh0aGlzLm51bUNsYWltZWRBbW91bnRzLmxlbmd0aCwgMCwgOClcbiAgfVxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBkZXBvc2l0VHhzOiB0aGlzLmRlcG9zaXRUeHMubWFwKCh0eElEKSA9PlxuICAgICAgICBzZXJpYWxpemF0aW9uLmVuY29kZXIodHhJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKVxuICAgICAgKSxcbiAgICAgIGNsYWltYWJsZU93bmVySURzOiB0aGlzLmNsYWltYWJsZU93bmVySURzLm1hcCgob3duZXJJRCkgPT5cbiAgICAgICAgc2VyaWFsaXphdGlvbi5lbmNvZGVyKG93bmVySUQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIilcbiAgICAgICksXG4gICAgICBjbGFpbWVkQW1vdW50czogdGhpcy5jbGFpbWVkQW1vdW50cy5tYXAoKGFtb3VudCkgPT5cbiAgICAgICAgc2VyaWFsaXphdGlvbi5lbmNvZGVyKGFtb3VudCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiZGVjaW1hbFN0cmluZ1wiKVxuICAgICAgKSxcbiAgICAgIGNsYWltVG86IHRoaXMuY2xhaW1Uby5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIG51bURlcG9zaXRUeHM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgZGVwb3NpdFR4czogQnVmZmVyW10gPSBbXVxuXG4gIHByb3RlY3RlZCBudW1DbGFpbWFibGVPd25lcklEczogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBjbGFpbWFibGVPd25lcklEczogQnVmZmVyW10gPSBbXVxuXG4gIHByb3RlY3RlZCBudW1DbGFpbWVkQW1vdW50czogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBjbGFpbWVkQW1vdW50czogQnVmZmVyW10gPSBbXVxuXG4gIC8vIERlcG9zaXQgcmV3YXJkcyBvdXRwdXRzIHdpbGwgYmUgbWludGVkIHRvIHRoaXMgb3duZXIsIHVubGVzcyBhbGwgb2YgaXRzIGZpZWxkcyBoYXMgemVyby12YWx1ZXMuXG4gIC8vIElmIGl0IGlzIGVtcHR5LCBkZXBvc2l0IHJld2FyZHMgd2lsbCBiZSBtaW50ZWQgZm9yIGRlcG9zaXRUeC5SZXdhcmRzT3duZXIuXG4gIHByb3RlY3RlZCBjbGFpbVRvOiBQYXJzZWFibGVPdXRwdXQgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIHNpZ0NvdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdID0gW10gLy8gaWR4cyBvZiBjbGFpbWFibGVJbiBzaWduZXJzXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW1JlZ2lzdGVyTm9kZVR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBjbGFpbWVkIG93bmVyIGlkc1xuICAgKi9cbiAgZ2V0Q2xhaW1hYmxlT3duZXJJRHMoKTogQnVmZmVyW10ge1xuICAgIHJldHVybiB0aGlzLmNsYWltYWJsZU93bmVySURzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgY2xhaW1lZCBhbW91bnRzXG4gICAqL1xuICBnZXRDbGFpbWVkQW1vdW50cygpOiBCdWZmZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuY2xhaW1lZEFtb3VudHNcbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgZGVwb3NpdCB0eCBpZHNcbiAgICovXG4gIGdldERlcG9zaXRUeHMoKTogQnVmZmVyW10ge1xuICAgIHJldHVybiB0aGlzLmRlcG9zaXRUeHNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjbGFpbVRvXG4gICAqL1xuICBnZXRDbGFpbVRvKCk6IFBhcnNlYWJsZU91dHB1dCB7XG4gICAgcmV0dXJuIHRoaXMuY2xhaW1Ub1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIFtbQ2xhaW1UeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbQ2xhaW1UeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbQ2xhaW1UeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0NsYWltVHhdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuXG4gICAgdGhpcy5udW1EZXBvc2l0VHhzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IHR4Q291bnQ6IG51bWJlciA9IHRoaXMubnVtRGVwb3NpdFR4cy5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLmRlcG9zaXRUeHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0eENvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHR4aWQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgICAgb2Zmc2V0ICs9IDMyXG4gICAgICB0aGlzLmRlcG9zaXRUeHMucHVzaCh0eGlkKVxuICAgIH1cblxuICAgIHRoaXMubnVtQ2xhaW1hYmxlT3duZXJJRHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgY29uc3Qgb3duZXJDb3VudDogbnVtYmVyID0gdGhpcy5udW1DbGFpbWFibGVPd25lcklEcy5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLmNsYWltYWJsZU93bmVySURzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgb3duZXJDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBvd25lcmlkOiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICAgIG9mZnNldCArPSAzMlxuICAgICAgdGhpcy5jbGFpbWFibGVPd25lcklEcy5wdXNoKG93bmVyaWQpXG4gICAgfVxuXG4gICAgdGhpcy5udW1DbGFpbWVkQW1vdW50cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBhbW91bnRDb3VudDogbnVtYmVyID0gdGhpcy5udW1DbGFpbWVkQW1vdW50cy5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLmNsYWltZWRBbW91bnRzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYW1vdW50Q291bnQ7IGkrKykge1xuICAgICAgY29uc3QgYW1vdW50OiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgICAgb2Zmc2V0ICs9IDhcbiAgICAgIHRoaXMuY2xhaW1lZEFtb3VudHMucHVzaChhbW91bnQpXG4gICAgfVxuXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBvZmZzZXQgPSB0aGlzLmNsYWltVG8uZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tDbGFpbVR4XV0uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxuXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbc3VwZXJidWZmXVxuXG4gICAgYmFyci5wdXNoKHRoaXMubnVtRGVwb3NpdFR4cylcbiAgICBic2l6ZSArPSB0aGlzLm51bURlcG9zaXRUeHMubGVuZ3RoXG5cbiAgICB0aGlzLmRlcG9zaXRUeHMuZm9yRWFjaCgoZGVwb3NpdFR4OiBCdWZmZXIpOiB2b2lkID0+IHtcbiAgICAgIGJzaXplICs9IGRlcG9zaXRUeC5sZW5ndGhcbiAgICAgIGJhcnIucHVzaChkZXBvc2l0VHgpXG4gICAgfSlcbiAgICBiYXJyLnB1c2godGhpcy5udW1DbGFpbWFibGVPd25lcklEcylcbiAgICBic2l6ZSArPSB0aGlzLm51bUNsYWltYWJsZU93bmVySURzLmxlbmd0aFxuICAgIHRoaXMuY2xhaW1hYmxlT3duZXJJRHMuZm9yRWFjaCgoY2xhaW1hYmxlT3duZXJJRDogQnVmZmVyKTogdm9pZCA9PiB7XG4gICAgICBiYXJyLnB1c2goY2xhaW1hYmxlT3duZXJJRClcbiAgICAgIGJzaXplICs9IGNsYWltYWJsZU93bmVySUQubGVuZ3RoXG4gICAgfSlcblxuICAgIGJhcnIucHVzaCh0aGlzLm51bUNsYWltZWRBbW91bnRzKVxuICAgIGJzaXplICs9IHRoaXMubnVtQ2xhaW1lZEFtb3VudHMubGVuZ3RoXG4gICAgdGhpcy5jbGFpbWVkQW1vdW50cy5mb3JFYWNoKChjbGFpbWVkQW1vdW50OiBCdWZmZXIpOiB2b2lkID0+IHtcbiAgICAgIGJhcnIucHVzaChjbGFpbWVkQW1vdW50KVxuICAgICAgYnNpemUgKz0gY2xhaW1lZEFtb3VudC5sZW5ndGhcbiAgICB9KVxuXG4gICAgYmFyci5wdXNoKHRoaXMuY2xhaW1Uby50b0J1ZmZlcigpKVxuICAgIGJzaXplICs9IHRoaXMuY2xhaW1Uby50b0J1ZmZlcigpLmxlbmd0aFxuXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdDbGFpbVR4OiBDbGFpbVR4ID0gbmV3IENsYWltVHgoKVxuICAgIG5ld0NsYWltVHguZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld0NsYWltVHggYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBDbGFpbVR4KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBhZGRzIGEgW1tTaWdJZHhdXSB0byB0aGUgW1tDbGFpbVR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIHNvdXJjZSBvZiB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhZGRTaWduYXR1cmVJZHgoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpOiB2b2lkIHtcbiAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxuICAgIHNpZ2lkeC5mcm9tQnVmZmVyKGIpXG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKVxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbVFhdXVxuICAgKi9cbiAgZ2V0U2lnSWR4cygpOiBTaWdJZHhbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnSWR4c1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW1RYXV1cbiAgICovXG4gIHNldFNpZ0lkeHMoc2lnSWR4czogU2lnSWR4W10pIHtcbiAgICB0aGlzLnNpZ0lkeHMgPSBzaWdJZHhzXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBSZWdpc3Rlck5vZGUgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gZGVwb3NpdFR4cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgZGVwb3NpdCB0eGlkc1xuICAgKiBAcGFyYW0gY2xhaW1hYmxlT3duZXJJRHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIGNsYWltYWJsZSBvd25lciBpZHNcbiAgICogQHBhcmFtIGNsYWltZWRBbW91bnRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBjbGFpbWVkIGFtb3VudHNcbiAgICogQHBhcmFtIGNsYWltVG8gT3B0aW9uYWwgdGhlIG93bmVyIG9mIHRoZSByZXdhcmRzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGRlcG9zaXRUeHM6IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2xhaW1hYmxlT3duZXJJRHM6IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2xhaW1lZEFtb3VudHM6IEJOW10gPSB1bmRlZmluZWQsXG4gICAgY2xhaW1UbzogUGFyc2VhYmxlT3V0cHV0ID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG5cbiAgICBpZiAodHlwZW9mIGRlcG9zaXRUeHMgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5udW1EZXBvc2l0VHhzLndyaXRlVUludDMyQkUoZGVwb3NpdFR4cy5sZW5ndGgsIDApXG4gICAgICBjb25zdCBkZXBvc2l0VHhCdWZzOiBCdWZmZXJbXSA9IFtdXG4gICAgICBkZXBvc2l0VHhzLmZvckVhY2goKHR4SUQ6IHN0cmluZyB8IEJ1ZmZlcik6IHZvaWQgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHR4SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBkZXBvc2l0VHhCdWZzLnB1c2goYmludG9vbHMuY2I1OERlY29kZSh0eElEKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXBvc2l0VHhCdWZzLnB1c2godHhJRClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHRoaXMuZGVwb3NpdFR4cyA9IGRlcG9zaXRUeEJ1ZnNcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNsYWltYWJsZU93bmVySURzICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubnVtQ2xhaW1hYmxlT3duZXJJRHMud3JpdGVVSW50MzJCRShjbGFpbWFibGVPd25lcklEcy5sZW5ndGgsIDApXG4gICAgICBjb25zdCBjbGFpbWFibGVPd25lcklEQnVmczogQnVmZmVyW10gPSBbXVxuICAgICAgY2xhaW1hYmxlT3duZXJJRHMuZm9yRWFjaCgob3duZXJJRDogc3RyaW5nIHwgQnVmZmVyKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3duZXJJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNsYWltYWJsZU93bmVySURCdWZzLnB1c2goYmludG9vbHMuY2I1OERlY29kZShvd25lcklEKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbGFpbWFibGVPd25lcklEQnVmcy5wdXNoKG93bmVySUQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNsYWltYWJsZU93bmVySURzID0gY2xhaW1hYmxlT3duZXJJREJ1ZnNcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNsYWltZWRBbW91bnRzICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubnVtQ2xhaW1lZEFtb3VudHMud3JpdGVVSW50MzJCRShjbGFpbWVkQW1vdW50cy5sZW5ndGgsIDApXG4gICAgICBjb25zdCBjbGFpbWVkQW1vdW50QnVmczogQnVmZmVyW10gPSBbXVxuICAgICAgY2xhaW1lZEFtb3VudHMuZm9yRWFjaCgoYW1vdW50OiBCTik6IHZvaWQgPT4ge1xuICAgICAgICBjbGFpbWVkQW1vdW50QnVmcy5wdXNoKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGFtb3VudCwgOCkpXG4gICAgICB9KVxuICAgICAgdGhpcy5jbGFpbWVkQW1vdW50cyA9IGNsYWltZWRBbW91bnRCdWZzXG4gICAgfVxuXG4gICAgdGhpcy5jbGFpbVRvID0gY2xhaW1Ub1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICpcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKi9cbiAgc2lnbihtc2c6IEJ1ZmZlciwga2M6IEtleUNoYWluKTogQ3JlZGVudGlhbFtdIHtcbiAgICBjb25zdCBjcmVkczogQ3JlZGVudGlhbFtdID0gc3VwZXIuc2lnbihtc2csIGtjKVxuICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gdGhpcy5nZXRTaWdJZHhzKClcbiAgICBjb25zdCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKFxuICAgICAgUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuICAgIClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2lnaWR4cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qga2V5cGFpcjogS2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2Ake2l9YF0uZ2V0U291cmNlKCkpXG4gICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxuICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXG4gICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXG4gICAgfVxuICAgIGNyZWRzLnB1c2goY3JlZClcbiAgICByZXR1cm4gY3JlZHNcbiAgfVxufVxuIl19