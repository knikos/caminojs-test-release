"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterNodeTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-RegisterNodeTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const common_1 = require("../../common");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const helperfunctions_1 = require("../../utils/helperfunctions");
const serialization_1 = require("../../utils/serialization");
const _1 = require(".");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned DepositTx transaction.
 */
class RegisterNodeTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned RegisterNode transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param oldNodeID Optional ID of the existing NodeID to replace or remove.
     * @param newNodeID Optional ID of the newNodID to register address.
     * @param address The consortiumMemberAddress, single or multi-sig.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, oldNodeID = undefined, newNodeID = undefined, address = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "RegisterNodeTx";
        this._typeID = constants_1.PlatformVMConstants.REGISTERNODETX;
        // Node id that will be unregistered for consortium member
        this.oldNodeID = buffer_1.Buffer.alloc(20);
        // Node id that will be registered for consortium member
        this.newNodeID = buffer_1.Buffer.alloc(20);
        // Address of consortium member to which node id will be registered
        this.consortiumMemberAddress = buffer_1.Buffer.alloc(20);
        // Signatures
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of subnet auth signers
        if (typeof oldNodeID !== "undefined")
            this.oldNodeID = oldNodeID;
        if (typeof newNodeID !== "undefined")
            this.newNodeID = newNodeID;
        if (typeof address != "undefined") {
            this.consortiumMemberAddress = address;
        }
        this.consortiumMemberAuth = new _1.SubnetAuth();
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { oldNodeID: (0, helperfunctions_1.bufferToNodeIDString)(this.oldNodeID), newNodeID: (0, helperfunctions_1.bufferToNodeIDString)(this.newNodeID), address: serialization.encoder(this.consortiumMemberAddress, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.oldNodeID = (0, helperfunctions_1.NodeIDStringToBuffer)(fields["oldNodeID"]);
        this.newNodeID = (0, helperfunctions_1.NodeIDStringToBuffer)(fields["newNodeID"]);
        this.consortiumMemberAddress = serialization.decoder(fields["address"], encoding, "cb58", "Buffer", 20);
    }
    /**
     * Returns the id of the [[RegisterNodeTx]]
     */
    getTxType() {
        return constants_1.PlatformVMConstants.REGISTERNODETX;
    }
    getOldNodeID() {
        return this.oldNodeID;
    }
    getNewNodeID() {
        return this.newNodeID;
    }
    getConsortiumMemberAddress() {
        return this.consortiumMemberAddress;
    }
    /**
     * Returns the subnetAuth
     */
    getConsortiumMemberAuth() {
        return this.consortiumMemberAuth;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[RegisterNodeTx]], parses it, populates the class, and returns the length of the [[RegisterNodeTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[RegisterNodeTx]]
     *
     * @returns The length of the raw [[RegisterNodeTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.oldNodeID = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.newNodeID = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        const sa = new _1.SubnetAuth();
        offset += sa.fromBuffer(bintools.copyFrom(bytes, offset));
        this.consortiumMemberAuth = sa;
        this.consortiumMemberAddress = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[RegisterNodeTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length + this.oldNodeID.length + this.newNodeID.length;
        const barr = [superbuff, this.oldNodeID, this.newNodeID];
        bsize += this.consortiumMemberAuth.toBuffer().length;
        barr.push(this.consortiumMemberAuth.toBuffer());
        bsize += this.consortiumMemberAddress.length;
        barr.push(this.consortiumMemberAddress);
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newRegisterNodeTx = new RegisterNodeTx();
        newRegisterNodeTx.fromBuffer(this.toBuffer());
        return newRegisterNodeTx;
    }
    create(...args) {
        return new RegisterNodeTx(...args);
    }
    /**
     * Creates and adds a [[SigIdx]] to the [[AddRegisterNodeTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx, address) {
        const addressIndex = buffer_1.Buffer.alloc(4);
        addressIndex.writeUIntBE(addressIdx, 0, 4);
        this.consortiumMemberAuth.addAddressIndex(addressIndex);
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
     * Sets the array of [[SigIdx]] for this [[TX]]
     */
    setSigIdxs(sigIdxs) {
        this.sigIdxs = sigIdxs;
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        this.consortiumMemberAuth.setAddressIndices(sigIdxs.map((idx) => idx.toBuffer()));
    }
    getCredentialID() {
        return constants_1.PlatformVMConstants.SECPCREDENTIAL;
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
        let cred = (0, _1.SelectCredentialClass)(this.getCredentialID());
        function addSig(source) {
            const keypair = kc.getKey(source);
            const signval = keypair.sign(msg);
            const sig = new common_1.Signature();
            sig.fromBuffer(signval);
            cred.addSignature(sig);
        }
        // Add NodeSignature
        if (!this.newNodeID.every((v) => v === 0) &&
            this.oldNodeID.every((v) => v === 0))
            addSig(this.newNodeID);
        creds.push(cred);
        cred = (0, _1.SelectCredentialClass)(this.getCredentialID());
        const sigidxs = this.getSigIdxs();
        for (let i = 0; i < sigidxs.length; i++) {
            addSig(sigidxs[`${i}`].getSource());
        }
        creds.push(cred);
        return creds;
    }
}
exports.RegisterNodeTx = RegisterNodeTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXJub2RldHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3JlZ2lzdGVybm9kZXR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQWlEO0FBR2pELHlDQUE0RDtBQUM1RCxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELGlFQUdvQztBQUNwQyw2REFBNkU7QUFDN0Usd0JBQXFEO0FBR3JEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsY0FBZSxTQUFRLGVBQU07SUE2TXhDOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsWUFBb0IsU0FBUyxFQUM3QixZQUFvQixTQUFTLEVBQzdCLFVBQWtCLFNBQVM7UUFFM0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQWxPdkMsY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxjQUFjLENBQUE7UUE2QnRELDBEQUEwRDtRQUNoRCxjQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM5Qyx3REFBd0Q7UUFDOUMsY0FBUyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7UUFJOUMsbUVBQW1FO1FB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LENBQUMsSUFBSSxDQUFDLENBQUE7UUFFaEIsSUFBSSxHQUFHLElBQUEsd0JBQXFCLEVBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUE7UUFDcEQsTUFBTSxPQUFPLEdBQWEsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQzNDLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQy9DLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7U0FDcEM7UUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2hCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztDQW1DRjtBQTlPRCx3Q0E4T0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1SZWdpc3Rlck5vZGVUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsLCBTaWdJZHgsIFNpZ25hdHVyZSB9IGZyb20gXCIuLi8uLi9jb21tb25cIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7XG4gIGJ1ZmZlclRvTm9kZUlEU3RyaW5nLFxuICBOb2RlSURTdHJpbmdUb0J1ZmZlclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcywgU3VibmV0QXV0aCB9IGZyb20gXCIuXCJcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBEZXBvc2l0VHggdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWdpc3Rlck5vZGVUeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlJlZ2lzdGVyTm9kZVR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlJFR0lTVEVSTk9ERVRYXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIG9sZE5vZGVJRDogYnVmZmVyVG9Ob2RlSURTdHJpbmcodGhpcy5vbGROb2RlSUQpLFxuICAgICAgbmV3Tm9kZUlEOiBidWZmZXJUb05vZGVJRFN0cmluZyh0aGlzLm5ld05vZGVJRCksXG4gICAgICBhZGRyZXNzOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuY29uc29ydGl1bU1lbWJlckFkZHJlc3MsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImNiNThcIlxuICAgICAgKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMub2xkTm9kZUlEID0gTm9kZUlEU3RyaW5nVG9CdWZmZXIoZmllbGRzW1wib2xkTm9kZUlEXCJdKVxuICAgIHRoaXMubmV3Tm9kZUlEID0gTm9kZUlEU3RyaW5nVG9CdWZmZXIoZmllbGRzW1wibmV3Tm9kZUlEXCJdKVxuICAgIHRoaXMuY29uc29ydGl1bU1lbWJlckFkZHJlc3MgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJhZGRyZXNzXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImNiNThcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAyMFxuICAgIClcbiAgfVxuXG4gIC8vIE5vZGUgaWQgdGhhdCB3aWxsIGJlIHVucmVnaXN0ZXJlZCBmb3IgY29uc29ydGl1bSBtZW1iZXJcbiAgcHJvdGVjdGVkIG9sZE5vZGVJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIwKVxuICAvLyBOb2RlIGlkIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIGZvciBjb25zb3J0aXVtIG1lbWJlclxuICBwcm90ZWN0ZWQgbmV3Tm9kZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMjApXG4gIC8vIEF1dGggdGhhdCB3aWxsIGJlIHVzZWQgdG8gdmVyaWZ5IGNyZWRlbnRpYWwgZm9yIFtDb25zb3J0aXVtTWVtYmVyQWRkcmVzc10uXG4gIC8vIElmIFtDb25zb3J0aXVtTWVtYmVyQWRkcmVzc10gaXMgbXNpZy1hbGlhcywgYXV0aCBtdXN0IG1hdGNoIHJlYWwgc2lnbmF0dXJlcy5cbiAgcHJvdGVjdGVkIGNvbnNvcnRpdW1NZW1iZXJBdXRoOiBTdWJuZXRBdXRoXG4gIC8vIEFkZHJlc3Mgb2YgY29uc29ydGl1bSBtZW1iZXIgdG8gd2hpY2ggbm9kZSBpZCB3aWxsIGJlIHJlZ2lzdGVyZWRcbiAgcHJvdGVjdGVkIGNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMjApXG4gIC8vIFNpZ25hdHVyZXNcbiAgcHJvdGVjdGVkIHNpZ0NvdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdID0gW10gLy8gaWR4cyBvZiBzdWJuZXQgYXV0aCBzaWduZXJzXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW1JlZ2lzdGVyTm9kZVR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiBQbGF0Zm9ybVZNQ29uc3RhbnRzLlJFR0lTVEVSTk9ERVRYXG4gIH1cblxuICBnZXRPbGROb2RlSUQoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5vbGROb2RlSURcbiAgfVxuXG4gIGdldE5ld05vZGVJRCgpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLm5ld05vZGVJRFxuICB9XG4gIGdldENvbnNvcnRpdW1NZW1iZXJBZGRyZXNzKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuY29uc29ydGl1bU1lbWJlckFkZHJlc3NcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdWJuZXRBdXRoXG4gICAqL1xuICBnZXRDb25zb3J0aXVtTWVtYmVyQXV0aCgpOiBTdWJuZXRBdXRoIHtcbiAgICByZXR1cm4gdGhpcy5jb25zb3J0aXVtTWVtYmVyQXV0aFxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIFtbUmVnaXN0ZXJOb2RlVHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW1JlZ2lzdGVyTm9kZVR4XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tSZWdpc3Rlck5vZGVUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1JlZ2lzdGVyTm9kZVR4XV1cbiAgICpcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLm9sZE5vZGVJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIwKVxuICAgIG9mZnNldCArPSAyMFxuXG4gICAgdGhpcy5uZXdOb2RlSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyMClcbiAgICBvZmZzZXQgKz0gMjBcblxuICAgIGNvbnN0IHNhOiBTdWJuZXRBdXRoID0gbmV3IFN1Ym5ldEF1dGgoKVxuICAgIG9mZnNldCArPSBzYS5mcm9tQnVmZmVyKGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQpKVxuICAgIHRoaXMuY29uc29ydGl1bU1lbWJlckF1dGggPSBzYVxuXG4gICAgdGhpcy5jb25zb3J0aXVtTWVtYmVyQWRkcmVzcyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIwKVxuICAgIG9mZnNldCArPSAyMFxuXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tSZWdpc3Rlck5vZGVUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcblxuICAgIGxldCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggKyB0aGlzLm9sZE5vZGVJRC5sZW5ndGggKyB0aGlzLm5ld05vZGVJRC5sZW5ndGhcblxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3N1cGVyYnVmZiwgdGhpcy5vbGROb2RlSUQsIHRoaXMubmV3Tm9kZUlEXVxuXG4gICAgYnNpemUgKz0gdGhpcy5jb25zb3J0aXVtTWVtYmVyQXV0aC50b0J1ZmZlcigpLmxlbmd0aFxuICAgIGJhcnIucHVzaCh0aGlzLmNvbnNvcnRpdW1NZW1iZXJBdXRoLnRvQnVmZmVyKCkpXG5cbiAgICBic2l6ZSArPSB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzLmxlbmd0aFxuICAgIGJhcnIucHVzaCh0aGlzLmNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzKVxuXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdSZWdpc3Rlck5vZGVUeDogUmVnaXN0ZXJOb2RlVHggPSBuZXcgUmVnaXN0ZXJOb2RlVHgoKVxuICAgIG5ld1JlZ2lzdGVyTm9kZVR4LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdSZWdpc3Rlck5vZGVUeCBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFJlZ2lzdGVyTm9kZVR4KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBhZGRzIGEgW1tTaWdJZHhdXSB0byB0aGUgW1tBZGRSZWdpc3Rlck5vZGVUeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc0lkeCBUaGUgaW5kZXggb2YgdGhlIGFkZHJlc3MgdG8gcmVmZXJlbmNlIGluIHRoZSBzaWduYXR1cmVzXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBzb3VyY2Ugb2YgdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgYWRkU2lnbmF0dXJlSWR4KGFkZHJlc3NJZHg6IG51bWJlciwgYWRkcmVzczogQnVmZmVyKTogdm9pZCB7XG4gICAgY29uc3QgYWRkcmVzc0luZGV4OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBhZGRyZXNzSW5kZXgud3JpdGVVSW50QkUoYWRkcmVzc0lkeCwgMCwgNClcbiAgICB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBdXRoLmFkZEFkZHJlc3NJbmRleChhZGRyZXNzSW5kZXgpXG5cbiAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxuICAgIHNpZ2lkeC5mcm9tQnVmZmVyKGIpXG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKVxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbVFhdXVxuICAgKi9cbiAgZ2V0U2lnSWR4cygpOiBTaWdJZHhbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnSWR4c1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFycmF5IG9mIFtbU2lnSWR4XV0gZm9yIHRoaXMgW1tUWF1dXG4gICAqL1xuICBzZXRTaWdJZHhzKHNpZ0lkeHM6IFNpZ0lkeFtdKSB7XG4gICAgdGhpcy5zaWdJZHhzID0gc2lnSWR4c1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxuICAgIHRoaXMuY29uc29ydGl1bU1lbWJlckF1dGguc2V0QWRkcmVzc0luZGljZXMoXG4gICAgICBzaWdJZHhzLm1hcCgoaWR4KSA9PiBpZHgudG9CdWZmZXIoKSlcbiAgICApXG4gIH1cblxuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICpcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKi9cbiAgc2lnbihtc2c6IEJ1ZmZlciwga2M6IEtleUNoYWluKTogQ3JlZGVudGlhbFtdIHtcbiAgICBjb25zdCBjcmVkczogQ3JlZGVudGlhbFtdID0gc3VwZXIuc2lnbihtc2csIGtjKVxuICAgIGxldCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKHRoaXMuZ2V0Q3JlZGVudGlhbElEKCkpXG5cbiAgICBmdW5jdGlvbiBhZGRTaWcoc291cmNlOiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc291cmNlKVxuICAgICAgY29uc3Qgc2lnbnZhbDogQnVmZmVyID0ga2V5cGFpci5zaWduKG1zZylcbiAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXG4gICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxuICAgICAgY3JlZC5hZGRTaWduYXR1cmUoc2lnKVxuICAgIH1cblxuICAgIC8vIEFkZCBOb2RlU2lnbmF0dXJlXG4gICAgaWYgKFxuICAgICAgIXRoaXMubmV3Tm9kZUlELmV2ZXJ5KCh2KSA9PiB2ID09PSAwKSAmJlxuICAgICAgdGhpcy5vbGROb2RlSUQuZXZlcnkoKHYpID0+IHYgPT09IDApXG4gICAgKVxuICAgICAgYWRkU2lnKHRoaXMubmV3Tm9kZUlEKVxuICAgIGNyZWRzLnB1c2goY3JlZClcblxuICAgIGNyZWQgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3ModGhpcy5nZXRDcmVkZW50aWFsSUQoKSlcbiAgICBjb25zdCBzaWdpZHhzOiBTaWdJZHhbXSA9IHRoaXMuZ2V0U2lnSWR4cygpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNpZ2lkeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFNpZyhzaWdpZHhzW2Ake2l9YF0uZ2V0U291cmNlKCkpXG4gICAgfVxuICAgIGNyZWRzLnB1c2goY3JlZClcbiAgICByZXR1cm4gY3JlZHNcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgUmVnaXN0ZXJOb2RlIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBPcHRpb25hbCBibG9ja2NoYWluSUQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXG4gICAqIEBwYXJhbSBvbGROb2RlSUQgT3B0aW9uYWwgSUQgb2YgdGhlIGV4aXN0aW5nIE5vZGVJRCB0byByZXBsYWNlIG9yIHJlbW92ZS5cbiAgICogQHBhcmFtIG5ld05vZGVJRCBPcHRpb25hbCBJRCBvZiB0aGUgbmV3Tm9kSUQgdG8gcmVnaXN0ZXIgYWRkcmVzcy5cbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzLCBzaW5nbGUgb3IgbXVsdGktc2lnLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvbGROb2RlSUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBuZXdOb2RlSUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhZGRyZXNzOiBCdWZmZXIgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcblxuICAgIGlmICh0eXBlb2Ygb2xkTm9kZUlEICE9PSBcInVuZGVmaW5lZFwiKSB0aGlzLm9sZE5vZGVJRCA9IG9sZE5vZGVJRFxuXG4gICAgaWYgKHR5cGVvZiBuZXdOb2RlSUQgIT09IFwidW5kZWZpbmVkXCIpIHRoaXMubmV3Tm9kZUlEID0gbmV3Tm9kZUlEXG5cbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jb25zb3J0aXVtTWVtYmVyQWRkcmVzcyA9IGFkZHJlc3NcbiAgICB9XG4gICAgdGhpcy5jb25zb3J0aXVtTWVtYmVyQXV0aCA9IG5ldyBTdWJuZXRBdXRoKClcbiAgfVxufVxuIl19