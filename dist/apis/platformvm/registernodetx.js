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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXJub2RldHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3JlZ2lzdGVybm9kZXR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQWlEO0FBR2pELHlDQUE0RDtBQUM1RCxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELGlFQUdvQztBQUNwQyw2REFBNkU7QUFDN0Usd0JBQXFEO0FBR3JEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsY0FBZSxTQUFRLGVBQU07SUFrTXhDOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsWUFBb0IsU0FBUyxFQUM3QixZQUFvQixTQUFTLEVBQzdCLFVBQWtCLFNBQVM7UUFFM0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQXZOdkMsY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxjQUFjLENBQUE7UUE2QnRELDBEQUEwRDtRQUNoRCxjQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM5Qyx3REFBd0Q7UUFDOUMsY0FBUyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7UUFJOUMsbUVBQW1FO1FB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O1NBQ3BDO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7Q0FtQ0Y7QUFuT0Qsd0NBbU9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tUmVnaXN0ZXJOb2RlVHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbCwgU2lnSWR4LCBTaWduYXR1cmUgfSBmcm9tIFwiLi4vLi4vY29tbW9uXCJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQge1xuICBidWZmZXJUb05vZGVJRFN0cmluZyxcbiAgTm9kZUlEU3RyaW5nVG9CdWZmZXJcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MsIFN1Ym5ldEF1dGggfSBmcm9tIFwiLlwiXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgRGVwb3NpdFR4IHRyYW5zYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgUmVnaXN0ZXJOb2RlVHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJSZWdpc3Rlck5vZGVUeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5SRUdJU1RFUk5PREVUWFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBvbGROb2RlSUQ6IGJ1ZmZlclRvTm9kZUlEU3RyaW5nKHRoaXMub2xkTm9kZUlEKSxcbiAgICAgIG5ld05vZGVJRDogYnVmZmVyVG9Ob2RlSURTdHJpbmcodGhpcy5uZXdOb2RlSUQpLFxuICAgICAgYWRkcmVzczogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzLFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJCdWZmZXJcIixcbiAgICAgICAgXCJjYjU4XCJcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLm9sZE5vZGVJRCA9IE5vZGVJRFN0cmluZ1RvQnVmZmVyKGZpZWxkc1tcIm9sZE5vZGVJRFwiXSlcbiAgICB0aGlzLm5ld05vZGVJRCA9IE5vZGVJRFN0cmluZ1RvQnVmZmVyKGZpZWxkc1tcIm5ld05vZGVJRFwiXSlcbiAgICB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiYWRkcmVzc1wiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJjYjU4XCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgMjBcbiAgICApXG4gIH1cblxuICAvLyBOb2RlIGlkIHRoYXQgd2lsbCBiZSB1bnJlZ2lzdGVyZWQgZm9yIGNvbnNvcnRpdW0gbWVtYmVyXG4gIHByb3RlY3RlZCBvbGROb2RlSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyMClcbiAgLy8gTm9kZSBpZCB0aGF0IHdpbGwgYmUgcmVnaXN0ZXJlZCBmb3IgY29uc29ydGl1bSBtZW1iZXJcbiAgcHJvdGVjdGVkIG5ld05vZGVJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIwKVxuICAvLyBBdXRoIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHZlcmlmeSBjcmVkZW50aWFsIGZvciBbQ29uc29ydGl1bU1lbWJlckFkZHJlc3NdLlxuICAvLyBJZiBbQ29uc29ydGl1bU1lbWJlckFkZHJlc3NdIGlzIG1zaWctYWxpYXMsIGF1dGggbXVzdCBtYXRjaCByZWFsIHNpZ25hdHVyZXMuXG4gIHByb3RlY3RlZCBjb25zb3J0aXVtTWVtYmVyQXV0aDogU3VibmV0QXV0aFxuICAvLyBBZGRyZXNzIG9mIGNvbnNvcnRpdW0gbWVtYmVyIHRvIHdoaWNoIG5vZGUgaWQgd2lsbCBiZSByZWdpc3RlcmVkXG4gIHByb3RlY3RlZCBjb25zb3J0aXVtTWVtYmVyQWRkcmVzczogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIwKVxuICAvLyBTaWduYXR1cmVzXG4gIHByb3RlY3RlZCBzaWdDb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBzaWdJZHhzOiBTaWdJZHhbXSA9IFtdIC8vIGlkeHMgb2Ygc3VibmV0IGF1dGggc2lnbmVyc1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tSZWdpc3Rlck5vZGVUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUGxhdGZvcm1WTUNvbnN0YW50cy5SRUdJU1RFUk5PREVUWFxuICB9XG5cbiAgZ2V0T2xkTm9kZUlEKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMub2xkTm9kZUlEXG4gIH1cblxuICBnZXROZXdOb2RlSUQoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5uZXdOb2RlSURcbiAgfVxuICBnZXRDb25zb3J0aXVtTWVtYmVyQWRkcmVzcygpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3VibmV0QXV0aFxuICAgKi9cbiAgZ2V0Q29uc29ydGl1bU1lbWJlckF1dGgoKTogU3VibmV0QXV0aCB7XG4gICAgcmV0dXJuIHRoaXMuY29uc29ydGl1bU1lbWJlckF1dGhcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSBbW1JlZ2lzdGVyTm9kZVR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tSZWdpc3Rlck5vZGVUeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbUmVnaXN0ZXJOb2RlVHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tSZWdpc3Rlck5vZGVUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5vbGROb2RlSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyMClcbiAgICBvZmZzZXQgKz0gMjBcblxuICAgIHRoaXMubmV3Tm9kZUlEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMjApXG4gICAgb2Zmc2V0ICs9IDIwXG5cbiAgICBjb25zdCBzYTogU3VibmV0QXV0aCA9IG5ldyBTdWJuZXRBdXRoKClcbiAgICBvZmZzZXQgKz0gc2EuZnJvbUJ1ZmZlcihiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0KSlcbiAgICB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBdXRoID0gc2FcblxuICAgIHRoaXMuY29uc29ydGl1bU1lbWJlckFkZHJlc3MgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyMClcbiAgICBvZmZzZXQgKz0gMjBcblxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbUmVnaXN0ZXJOb2RlVHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG5cbiAgICBsZXQgYnNpemU6IG51bWJlciA9XG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICsgdGhpcy5vbGROb2RlSUQubGVuZ3RoICsgdGhpcy5uZXdOb2RlSUQubGVuZ3RoXG5cbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlcmJ1ZmYsIHRoaXMub2xkTm9kZUlELCB0aGlzLm5ld05vZGVJRF1cblxuICAgIGJzaXplICs9IHRoaXMuY29uc29ydGl1bU1lbWJlckF1dGgudG9CdWZmZXIoKS5sZW5ndGhcbiAgICBiYXJyLnB1c2godGhpcy5jb25zb3J0aXVtTWVtYmVyQXV0aC50b0J1ZmZlcigpKVxuXG4gICAgYnNpemUgKz0gdGhpcy5jb25zb3J0aXVtTWVtYmVyQWRkcmVzcy5sZW5ndGhcbiAgICBiYXJyLnB1c2godGhpcy5jb25zb3J0aXVtTWVtYmVyQWRkcmVzcylcblxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3UmVnaXN0ZXJOb2RlVHg6IFJlZ2lzdGVyTm9kZVR4ID0gbmV3IFJlZ2lzdGVyTm9kZVR4KClcbiAgICBuZXdSZWdpc3Rlck5vZGVUeC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3UmVnaXN0ZXJOb2RlVHggYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBSZWdpc3Rlck5vZGVUeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgYWRkcyBhIFtbU2lnSWR4XV0gdG8gdGhlIFtbQWRkUmVnaXN0ZXJOb2RlVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NJZHggVGhlIGluZGV4IG9mIHRoZSBhZGRyZXNzIHRvIHJlZmVyZW5jZSBpbiB0aGUgc2lnbmF0dXJlc1xuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgc291cmNlIG9mIHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGFkZFNpZ25hdHVyZUlkeChhZGRyZXNzSWR4OiBudW1iZXIsIGFkZHJlc3M6IEJ1ZmZlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkZHJlc3NJbmRleDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgYWRkcmVzc0luZGV4LndyaXRlVUludEJFKGFkZHJlc3NJZHgsIDAsIDQpXG4gICAgdGhpcy5jb25zb3J0aXVtTWVtYmVyQXV0aC5hZGRBZGRyZXNzSW5kZXgoYWRkcmVzc0luZGV4KVxuXG4gICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBiLndyaXRlVUludDMyQkUoYWRkcmVzc0lkeCwgMClcbiAgICBzaWdpZHguZnJvbUJ1ZmZlcihiKVxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW1RYXV1cbiAgICovXG4gIGdldFNpZ0lkeHMoKTogU2lnSWR4W10ge1xuICAgIHJldHVybiB0aGlzLnNpZ0lkeHNcbiAgfVxuXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgdGhlIGJ5dGVzIG9mIGFuIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKlxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqL1xuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBzdXBlci5zaWduKG1zZywga2MpXG4gICAgbGV0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3ModGhpcy5nZXRDcmVkZW50aWFsSUQoKSlcblxuICAgIGZ1bmN0aW9uIGFkZFNpZyhzb3VyY2U6IEJ1ZmZlcikge1xuICAgICAgY29uc3Qga2V5cGFpcjogS2V5UGFpciA9IGtjLmdldEtleShzb3VyY2UpXG4gICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxuICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXG4gICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXG4gICAgfVxuXG4gICAgLy8gQWRkIE5vZGVTaWduYXR1cmVcbiAgICBpZiAoXG4gICAgICAhdGhpcy5uZXdOb2RlSUQuZXZlcnkoKHYpID0+IHYgPT09IDApICYmXG4gICAgICB0aGlzLm9sZE5vZGVJRC5ldmVyeSgodikgPT4gdiA9PT0gMClcbiAgICApXG4gICAgICBhZGRTaWcodGhpcy5uZXdOb2RlSUQpXG4gICAgY3JlZHMucHVzaChjcmVkKVxuXG4gICAgY3JlZCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyh0aGlzLmdldENyZWRlbnRpYWxJRCgpKVxuICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gdGhpcy5nZXRTaWdJZHhzKClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2lnaWR4cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkU2lnKHNpZ2lkeHNbYCR7aX1gXS5nZXRTb3VyY2UoKSlcbiAgICB9XG4gICAgY3JlZHMucHVzaChjcmVkKVxuICAgIHJldHVybiBjcmVkc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBSZWdpc3Rlck5vZGUgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIG9sZE5vZGVJRCBPcHRpb25hbCBJRCBvZiB0aGUgZXhpc3RpbmcgTm9kZUlEIHRvIHJlcGxhY2Ugb3IgcmVtb3ZlLlxuICAgKiBAcGFyYW0gbmV3Tm9kZUlEIE9wdGlvbmFsIElEIG9mIHRoZSBuZXdOb2RJRCB0byByZWdpc3RlciBhZGRyZXNzLlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgY29uc29ydGl1bU1lbWJlckFkZHJlc3MsIHNpbmdsZSBvciBtdWx0aS1zaWcuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG9sZE5vZGVJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG5ld05vZGVJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFkZHJlc3M6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuXG4gICAgaWYgKHR5cGVvZiBvbGROb2RlSUQgIT09IFwidW5kZWZpbmVkXCIpIHRoaXMub2xkTm9kZUlEID0gb2xkTm9kZUlEXG5cbiAgICBpZiAodHlwZW9mIG5ld05vZGVJRCAhPT0gXCJ1bmRlZmluZWRcIikgdGhpcy5uZXdOb2RlSUQgPSBuZXdOb2RlSURcblxuICAgIGlmICh0eXBlb2YgYWRkcmVzcyAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzID0gYWRkcmVzc1xuICAgIH1cbiAgICB0aGlzLmNvbnNvcnRpdW1NZW1iZXJBdXRoID0gbmV3IFN1Ym5ldEF1dGgoKVxuICB9XG59XG4iXX0=