"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimTx = exports.ClaimAmount = exports.ClaimType = void 0;
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
const bn_js_1 = __importDefault(require("bn.js"));
const common_1 = require("../../common");
const credentials_1 = require("./credentials");
const subnetauth_1 = require("./subnetauth");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
var ClaimType;
(function (ClaimType) {
    ClaimType["VALIDATOR_REWARD"] = "0";
    ClaimType["EXPIRED_DEPOSIT_REWARD"] = "1";
    ClaimType["ALL_TREASURY_REWARD"] = "2";
    ClaimType["ACTIVE_DEPOSIT_REWARD"] = "3";
})(ClaimType = exports.ClaimType || (exports.ClaimType = {}));
//
class ClaimAmount {
    /**
     * Class representing a ClaimAmount.
     *
     * @param id Optional either depositTxID or OwnableHash, depends on claimType
     * @param claimType Optional specifies the type of reward to claim
     * @param amount Optional the amount to claim from this reward source
     */
    constructor(id = undefined, claimType = undefined, amount = undefined, auth = undefined) {
        this.id = buffer_1.Buffer.alloc(32);
        this.type = buffer_1.Buffer.alloc(8);
        this.amount = buffer_1.Buffer.alloc(8);
        this.auth = new subnetauth_1.SubnetAuth();
        if (typeof id != "undefined")
            this.id = id;
        if (typeof claimType != "undefined")
            this.type = bintools.fromBNToBuffer(new bn_js_1.default(claimType), 8);
        if (typeof amount != "undefined")
            this.amount = bintools.fromBNToBuffer(amount, 8);
        if (typeof auth != "undefined")
            this.auth.setAddressIndices(auth);
    }
    deserialize(fields, encoding = "hex") {
        this.id = serialization.decoder(fields["id"], encoding, "cb58", "Buffer");
        this.type = serialization.decoder(fields["type"], encoding, "decimalString", "Buffer", 8);
        this.amount = serialization.decoder(fields["amounts"], encoding, "decimalString", "Buffer");
        return this;
    }
    serialize(encoding = "hex") {
        return {
            id: serialization.encoder(this.id, encoding, "Buffer", "cb58"),
            type: serialization.encoder(this.type, encoding, "Buffer", "decimalString"),
            amount: serialization.encoder(this.amount, encoding, "Buffer", "decimalString")
        };
    }
    fromBuffer(bytes, offset = 0) {
        this.id = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.type = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        offset += this.auth.fromBuffer(bytes, offset);
        return offset;
    }
    toBuffer() {
        const authBuffer = this.auth.toBuffer();
        return buffer_1.Buffer.concat([this.id, this.type, this.amount, authBuffer], 32 + 8 + 8 + authBuffer.length);
    }
}
exports.ClaimAmount = ClaimAmount;
/**
 * Class representing an unsigned ClaimTx transaction.
 */
class ClaimTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Claim transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param claimAmounts Optional array of ClaimAmount class instances
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, claimAmounts = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "ClaimTx";
        this._typeID = constants_1.PlatformVMConstants.CLAIMTX;
        this.numClaimAmounts = buffer_1.Buffer.alloc(4);
        this.claimAmounts = [];
        this.sigIdxs = []; // one sigIdx[] per claimAmount
        if (typeof claimAmounts != "undefined") {
            this.numClaimAmounts.writeUInt32BE(claimAmounts.length, 0);
            this.claimAmounts = claimAmounts;
        }
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.claimAmounts = fields["claimAmounts"].map((sub) => new ClaimAmount().deserialize(sub, encoding));
        this.numClaimAmounts.writeUInt32BE(this.claimAmounts.length, 0);
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { claimAmounts: this.claimAmounts.map((ca) => ca.serialize(encoding)) });
    }
    /**
     * Returns the id of the [[RegisterNodeTx]]
     */
    getTxType() {
        return this._typeID;
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
        this.numClaimAmounts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const txCount = this.numClaimAmounts.readUInt32BE(0);
        this.claimAmounts = [];
        for (let i = 0; i < txCount; i++) {
            const ca = new ClaimAmount();
            offset = ca.fromBuffer(bytes, offset);
            this.claimAmounts.push(ca);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ClaimTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length;
        const barr = [superbuff];
        barr.push(this.numClaimAmounts);
        bsize += this.numClaimAmounts.length;
        this.claimAmounts.forEach((ca) => {
            const amount = ca.toBuffer();
            bsize += amount.length;
            barr.push(amount);
        });
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
     * Adds an array of [[SigIdx]] to the [[ClaimTx]].
     *
     * @param sigIdxs The Signature indices to verify one claimAmount
     */
    addSigIdxs(sigIdxs) {
        this.sigIdxs.push(sigIdxs);
    }
    /**
     * Returns the array of [[SigIdx[]]] for this [[TX]]
     */
    getSigIdxs() {
        return this.sigIdxs;
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
        for (const sigidxs of this.sigIdxs) {
            const cred = (0, credentials_1.SelectCredentialClass)(constants_1.PlatformVMConstants.SECPCREDENTIAL);
            for (let i = 0; i < sigidxs.length; i++) {
                const keypair = kc.getKey(sigidxs[`${i}`].getSource());
                const signval = keypair.sign(msg);
                const sig = new common_1.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        return creds;
    }
}
exports.ClaimTx = ClaimTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhaW10eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vY2xhaW10eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUFpRDtBQUdqRCxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELDZEQUE2RTtBQUM3RSxrREFBc0I7QUFDdEIseUNBQTREO0FBRTVELCtDQUFxRDtBQUNyRCw2Q0FBeUM7QUFFekM7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFLElBQVksU0FLWDtBQUxELFdBQVksU0FBUztJQUNuQixtQ0FBc0IsQ0FBQTtJQUN0Qix5Q0FBNEIsQ0FBQTtJQUM1QixzQ0FBeUIsQ0FBQTtJQUN6Qix3Q0FBMkIsQ0FBQTtBQUM3QixDQUFDLEVBTFcsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFLcEI7QUFFRCxFQUFFO0FBQ0YsTUFBYSxXQUFXO0lBZ0V0Qjs7Ozs7O09BTUc7SUFDSCxZQUNFLEtBQWEsU0FBUyxFQUN0QixZQUF1QixTQUFTLEVBQ2hDLFNBQWEsU0FBUyxFQUN0QixPQUFpQixTQUFTO1FBMUVsQixPQUFFLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNyQixTQUFJLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN0QixXQUFNLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN4QixTQUFJLEdBQUcsSUFBSSx1QkFBVSxFQUFFLENBQUE7UUF5RS9CLElBQUksT0FBTyxFQUFFLElBQUksV0FBVztZQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxD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T0FPRztJQUNILElBQUksQ0FBQyxHQUFXLEVBQUUsRUFBWTtRQUM1QixNQUFNLEtBQUssR0FBaUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDL0MsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxHQUFlLElBQUEsbUNBQXFCLEVBQzVDLCtCQUFtQixDQUFDLGNBQWMsQ0FDbkMsQ0FBQTtZQUNELEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMvQyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtnQkFDL0QsTUFBTSxPQUFPLEdBQVcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDekMsTUFBTSxHQUFHLEdBQWMsSUFBSSxrQkFBUyxFQUFFLENBQUE7Z0JBQ3RDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7YUFDdkI7WUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ2pCO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBQ0Y7QUF4SkQsMEJBd0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tQ2xhaW1UeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsLCBTaWdJZHgsIFNpZ25hdHVyZSB9IGZyb20gXCIuLi8uLi9jb21tb25cIlxuaW1wb3J0IHsgS2V5Q2hhaW4sIEtleVBhaXIgfSBmcm9tIFwiY2FtaW5vanMvYXBpcy9wbGF0Zm9ybXZtL2tleWNoYWluXCJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcbmltcG9ydCB7IFN1Ym5ldEF1dGggfSBmcm9tIFwiLi9zdWJuZXRhdXRoXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuZXhwb3J0IGVudW0gQ2xhaW1UeXBlIHtcbiAgVkFMSURBVE9SX1JFV0FSRCA9IFwiMFwiLFxuICBFWFBJUkVEX0RFUE9TSVRfUkVXQVJEID0gXCIxXCIsXG4gIEFMTF9UUkVBU1VSWV9SRVdBUkQgPSBcIjJcIixcbiAgQUNUSVZFX0RFUE9TSVRfUkVXQVJEID0gXCIzXCJcbn1cblxuLy9cbmV4cG9ydCBjbGFzcyBDbGFpbUFtb3VudCB7XG4gIHByb3RlY3RlZCBpZCA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIHR5cGUgPSBCdWZmZXIuYWxsb2MoOClcbiAgcHJvdGVjdGVkIGFtb3VudCA9IEJ1ZmZlci5hbGxvYyg4KVxuICBwcm90ZWN0ZWQgYXV0aCA9IG5ldyBTdWJuZXRBdXRoKClcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiB0aGlzIHtcbiAgICB0aGlzLmlkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKGZpZWxkc1tcImlkXCJdLCBlbmNvZGluZywgXCJjYjU4XCIsIFwiQnVmZmVyXCIpXG5cbiAgICB0aGlzLnR5cGUgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJ0eXBlXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA4XG4gICAgKVxuXG4gICAgdGhpcy5hbW91bnQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJhbW91bnRzXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCJcbiAgICApXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5pZCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcbiAgICAgIHR5cGU6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy50eXBlLFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJCdWZmZXJcIixcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCJcbiAgICAgICksXG4gICAgICBhbW91bnQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5hbW91bnQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy50eXBlID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgOClcbiAgICBvZmZzZXQgKz0gOFxuICAgIHRoaXMuYW1vdW50ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgOClcbiAgICBvZmZzZXQgKz0gOFxuICAgIG9mZnNldCArPSB0aGlzLmF1dGguZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBhdXRoQnVmZmVyID0gdGhpcy5hdXRoLnRvQnVmZmVyKClcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChcbiAgICAgIFt0aGlzLmlkLCB0aGlzLnR5cGUsIHRoaXMuYW1vdW50LCBhdXRoQnVmZmVyXSxcbiAgICAgIDMyICsgOCArIDggKyBhdXRoQnVmZmVyLmxlbmd0aFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYSBDbGFpbUFtb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGlkIE9wdGlvbmFsIGVpdGhlciBkZXBvc2l0VHhJRCBvciBPd25hYmxlSGFzaCwgZGVwZW5kcyBvbiBjbGFpbVR5cGVcbiAgICogQHBhcmFtIGNsYWltVHlwZSBPcHRpb25hbCBzcGVjaWZpZXMgdGhlIHR5cGUgb2YgcmV3YXJkIHRvIGNsYWltXG4gICAqIEBwYXJhbSBhbW91bnQgT3B0aW9uYWwgdGhlIGFtb3VudCB0byBjbGFpbSBmcm9tIHRoaXMgcmV3YXJkIHNvdXJjZVxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgaWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBjbGFpbVR5cGU6IENsYWltVHlwZSA9IHVuZGVmaW5lZCxcbiAgICBhbW91bnQ6IEJOID0gdW5kZWZpbmVkLFxuICAgIGF1dGg6IEJ1ZmZlcltdID0gdW5kZWZpbmVkXG4gICkge1xuICAgIGlmICh0eXBlb2YgaWQgIT0gXCJ1bmRlZmluZWRcIikgdGhpcy5pZCA9IGlkXG4gICAgaWYgKHR5cGVvZiBjbGFpbVR5cGUgIT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHRoaXMudHlwZSA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTihjbGFpbVR5cGUpLCA4KVxuICAgIGlmICh0eXBlb2YgYW1vdW50ICE9IFwidW5kZWZpbmVkXCIpXG4gICAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGFtb3VudCwgOClcbiAgICBpZiAodHlwZW9mIGF1dGggIT0gXCJ1bmRlZmluZWRcIikgdGhpcy5hdXRoLnNldEFkZHJlc3NJbmRpY2VzKGF1dGgpXG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQ2xhaW1UeCB0cmFuc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENsYWltVHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJDbGFpbVR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNMQUlNVFhcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuY2xhaW1BbW91bnRzID0gZmllbGRzW1wiY2xhaW1BbW91bnRzXCJdLm1hcCgoc3ViOiBPYmplY3QpID0+XG4gICAgICBuZXcgQ2xhaW1BbW91bnQoKS5kZXNlcmlhbGl6ZShzdWIsIGVuY29kaW5nKVxuICAgIClcbiAgICB0aGlzLm51bUNsYWltQW1vdW50cy53cml0ZVVJbnQzMkJFKHRoaXMuY2xhaW1BbW91bnRzLmxlbmd0aCwgMClcbiAgfVxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBjbGFpbUFtb3VudHM6IHRoaXMuY2xhaW1BbW91bnRzLm1hcCgoY2EpID0+IGNhLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIG51bUNsYWltQW1vdW50czogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBjbGFpbUFtb3VudHM6IENsYWltQW1vdW50W10gPSBbXVxuXG4gIHByb3RlY3RlZCBzaWdJZHhzOiBTaWdJZHhbXVtdID0gW10gLy8gb25lIHNpZ0lkeFtdIHBlciBjbGFpbUFtb3VudFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tSZWdpc3Rlck5vZGVUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgW1tDbGFpbVR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tDbGFpbVR4XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tDbGFpbVR4XV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQ2xhaW1UeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG5cbiAgICB0aGlzLm51bUNsYWltQW1vdW50cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCB0eENvdW50ID0gdGhpcy5udW1DbGFpbUFtb3VudHMucmVhZFVJbnQzMkJFKDApXG4gICAgdGhpcy5jbGFpbUFtb3VudHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHhDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBjYSA9IG5ldyBDbGFpbUFtb3VudCgpXG4gICAgICBvZmZzZXQgPSBjYS5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLmNsYWltQW1vdW50cy5wdXNoKGNhKVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0NsYWltVHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG5cbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHN1cGVyYnVmZi5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlcmJ1ZmZdXG5cbiAgICBiYXJyLnB1c2godGhpcy5udW1DbGFpbUFtb3VudHMpXG4gICAgYnNpemUgKz0gdGhpcy5udW1DbGFpbUFtb3VudHMubGVuZ3RoXG5cbiAgICB0aGlzLmNsYWltQW1vdW50cy5mb3JFYWNoKChjYSk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgYW1vdW50ID0gY2EudG9CdWZmZXIoKVxuICAgICAgYnNpemUgKz0gYW1vdW50Lmxlbmd0aFxuICAgICAgYmFyci5wdXNoKGFtb3VudClcbiAgICB9KVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3Q2xhaW1UeDogQ2xhaW1UeCA9IG5ldyBDbGFpbVR4KClcbiAgICBuZXdDbGFpbVR4LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdDbGFpbVR4IGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgQ2xhaW1UeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBhcnJheSBvZiBbW1NpZ0lkeF1dIHRvIHRoZSBbW0NsYWltVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHNpZ0lkeHMgVGhlIFNpZ25hdHVyZSBpbmRpY2VzIHRvIHZlcmlmeSBvbmUgY2xhaW1BbW91bnRcbiAgICovXG4gIGFkZFNpZ0lkeHMoc2lnSWR4czogU2lnSWR4W10pOiB2b2lkIHtcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdJZHhzKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIFtbU2lnSWR4W11dXSBmb3IgdGhpcyBbW1RYXV1cbiAgICovXG4gIGdldFNpZ0lkeHMoKTogU2lnSWR4W11bXSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnSWR4c1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBDbGFpbSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBjbGFpbUFtb3VudHMgT3B0aW9uYWwgYXJyYXkgb2YgQ2xhaW1BbW91bnQgY2xhc3MgaW5zdGFuY2VzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGNsYWltQW1vdW50czogQ2xhaW1BbW91bnRbXSA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuXG4gICAgaWYgKHR5cGVvZiBjbGFpbUFtb3VudHMgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5udW1DbGFpbUFtb3VudHMud3JpdGVVSW50MzJCRShjbGFpbUFtb3VudHMubGVuZ3RoLCAwKVxuICAgICAgdGhpcy5jbGFpbUFtb3VudHMgPSBjbGFpbUFtb3VudHNcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgdGhlIGJ5dGVzIG9mIGFuIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKlxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqL1xuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBzdXBlci5zaWduKG1zZywga2MpXG4gICAgZm9yIChjb25zdCBzaWdpZHhzIG9mIHRoaXMuc2lnSWR4cykge1xuICAgICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhcbiAgICAgICAgUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuICAgICAgKVxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNpZ2lkeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5cGFpcjogS2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2Ake2l9YF0uZ2V0U291cmNlKCkpXG4gICAgICAgIGNvbnN0IHNpZ252YWw6IEJ1ZmZlciA9IGtleXBhaXIuc2lnbihtc2cpXG4gICAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXG4gICAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcbiAgICAgIH1cbiAgICAgIGNyZWRzLnB1c2goY3JlZClcbiAgICB9XG4gICAgcmV0dXJuIGNyZWRzXG4gIH1cbn1cbiJdfQ==