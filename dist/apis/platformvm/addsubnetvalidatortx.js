"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSubnetValidatorTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-AddSubnetValidatorTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const common_1 = require("../../common");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const _1 = require(".");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned AddSubnetValidatorTx transaction.
 */
class AddSubnetValidatorTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned AddSubnetValidator transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
     * @param weight Optional. Weight of this validator used when sampling
     * @param subnetID Optional. ID of the subnet this validator is validating
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, weight = undefined, subnetID = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "AddSubnetValidatorTx";
        this._typeID = constants_1.PlatformVMConstants.ADDSUBNETVALIDATORTX;
        this.nodeID = buffer_1.Buffer.alloc(20);
        this.startTime = buffer_1.Buffer.alloc(8);
        this.endTime = buffer_1.Buffer.alloc(8);
        this.weight = buffer_1.Buffer.alloc(8);
        this.subnetID = buffer_1.Buffer.alloc(32);
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of subnet auth signers
        this.withNodeSig = false;
        if (typeof subnetID != "undefined") {
            if (typeof subnetID === "string") {
                this.subnetID = bintools.cb58Decode(subnetID);
            }
            else {
                this.subnetID = subnetID;
            }
        }
        if (typeof nodeID != "undefined") {
            this.nodeID = nodeID;
        }
        if (typeof startTime != "undefined") {
            this.startTime = bintools.fromBNToBuffer(startTime, 8);
        }
        if (typeof endTime != "undefined") {
            this.endTime = bintools.fromBNToBuffer(endTime, 8);
        }
        if (typeof weight != "undefined") {
            this.weight = bintools.fromBNToBuffer(weight, 8);
        }
        const subnetAuth = new _1.SubnetAuth();
        this.subnetAuth = subnetAuth;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { subnetID: serialization.encoder(this.subnetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.subnetID = serialization.decoder(fields["subnetID"], encoding, "cb58", "Buffer", 32);
        // this.exportOuts = fields["exportOuts"].map((e: object) => {
        //   let eo: TransferableOutput = new TransferableOutput()
        //   eo.deserialize(e, encoding)
        //   return eo
        // })
    }
    /**
     * Returns the id of the [[AddSubnetValidatorTx]]
     */
    getTxType() {
        return constants_1.PlatformVMConstants.ADDSUBNETVALIDATORTX;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getNodeID() {
        return this.nodeID;
    }
    /**
     * Returns a string for the nodeID amount.
     */
    getNodeIDString() {
        return (0, utils_1.bufferToNodeIDString)(this.nodeID);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the startTime.
     */
    getStartTime() {
        return bintools.fromBufferToBN(this.startTime);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the endTime.
     */
    getEndTime() {
        return bintools.fromBufferToBN(this.endTime);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the weight
     */
    getWeight() {
        return bintools.fromBufferToBN(this.weight);
    }
    /**
     * Returns the subnetID as a string
     */
    getSubnetID() {
        return bintools.cb58Encode(this.subnetID);
    }
    /**
     * Returns the subnetAuth
     */
    getSubnetAuth() {
        return this.subnetAuth;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddSubnetValidatorTx]], parses it, populates the class, and returns the length of the [[CreateChainTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddSubnetValidatorTx]]
     *
     * @returns The length of the raw [[AddSubnetValidatorTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.nodeID = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.startTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.endTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.weight = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.subnetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const sa = new _1.SubnetAuth();
        offset += sa.fromBuffer(bintools.copyFrom(bytes, offset));
        this.subnetAuth = sa;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateChainTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = superbuff.length +
            this.nodeID.length +
            this.startTime.length +
            this.endTime.length +
            this.weight.length +
            this.subnetID.length +
            this.subnetAuth.toBuffer().length;
        const barr = [
            superbuff,
            this.nodeID,
            this.startTime,
            this.endTime,
            this.weight,
            this.subnetID,
            this.subnetAuth.toBuffer()
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newAddSubnetValidatorTx = new AddSubnetValidatorTx();
        newAddSubnetValidatorTx.fromBuffer(this.toBuffer());
        return newAddSubnetValidatorTx;
    }
    create(...args) {
        return new AddSubnetValidatorTx(...args);
    }
    /**
     * Creates and adds a [[SigIdx]] to the [[AddSubnetValidatorTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx, address) {
        const addressIndex = buffer_1.Buffer.alloc(4);
        addressIndex.writeUIntBE(addressIdx, 0, 4);
        this.subnetAuth.addAddressIndex(addressIndex);
        const sigidx = new common_1.SigIdx();
        const b = buffer_1.Buffer.alloc(4);
        b.writeUInt32BE(addressIdx, 0);
        sigidx.fromBuffer(b);
        sigidx.setSource(address);
        this.sigIdxs.push(sigidx);
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    includeNodeSignature() {
        this.withNodeSig = true;
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
     * @param kc A [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const creds = super.sign(msg, kc);
        const sigidxs = this.getSigIdxs();
        let cred = (0, _1.SelectCredentialClass)(this.getCredentialID());
        for (let i = 0; i < sigidxs.length; i++) {
            const keypair = kc.getKey(sigidxs[`${i}`].getSource());
            const signval = keypair.sign(msg);
            const sig = new common_1.Signature();
            sig.fromBuffer(signval);
            cred.addSignature(sig);
        }
        creds.push(cred);
        if (this.withNodeSig) {
            cred = cred.create();
            const keypair = kc.getKey(this.nodeID);
            const signval = keypair.sign(msg);
            const sig = new common_1.Signature();
            sig.fromBuffer(signval);
            cred.addSignature(sig);
            creds.push(cred);
        }
        return creds;
    }
}
exports.AddSubnetValidatorTx = AddSubnetValidatorTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkc3VibmV0dmFsaWRhdG9ydHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2FkZHN1Ym5ldHZhbGlkYXRvcnR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQWlEO0FBR2pELHlDQUE0RDtBQUM1RCxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELDZEQUE2RTtBQUM3RSx3QkFBcUQ7QUFHckQsdUNBQWtEO0FBRWxEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsb0JBQXFCLFNBQVEsZUFBTTtJQXlPOUM7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNILFlBQ0UsWUFBb0IsNEJBQWdCLEVBQ3BDLGVBQXVCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMzQyxPQUE2QixTQUFTLEVBQ3RDLE1BQTJCLFNBQVMsRUFDcEMsT0FBZSxTQUFTLEVBQ3hCLFNBQWlCLFNBQVMsRUFDMUIsWUFBZ0IsU0FBUyxFQUN6QixVQUFjLFNBQVMsRUFDdkIsU0FBYSxTQUFTLEVBQ3RCLFdBQTRCLFNBQVM7UUFFckMsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQWxRdkMsY0FBUyxHQUFHLHNCQUFzQixDQUFBO1FBQ2xDLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQTtRQTBCbEQsV0FBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDakMsY0FBUyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbkMsWUFBTyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDakMsV0FBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMsYUFBUSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFbkMsYUFBUSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbEMsWUFBTyxHQUFhLEVBQUUsQ0FBQSxDQUFDLDhCQUE4QjtRQUNyRCxnQkFBVyxHQUFZLEtBQUssQ0FBQTtRQWdPcEMsSUFBSSxPQUFPLFFBQVEsSUFBSSxXQUFXLEVBQUU7WUFDbEMsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUM5QztpQkFBTTtnQkFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTthQUN6QjtTQUNGO1FBQ0QsSUFBSSxPQUFPLE1BQU0sSUFBSSxXQUFXLEVBQUU7WUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7U0FDckI7UUFDRCxJQUFJLE9BQU8sU0FBUyxJQUFJLFdBQVcsRUFBRTtZQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFBO1NBQ3ZEO1FBQ0QsSUFBSSxPQUFPLE9BQU8sSUFBSSxXQUFXLEVBQUU7WUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUNuRDtRQUNELElBQUksT0FBTyxNQUFNLElBQUksV0FBVyxFQUFFO1lBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7U0FDakQ7UUFFRCxNQUFNLFVBQVUsR0FBZSxJQUFJLGFBQVUsRUFBRSxDQUFBO1FBQy9DLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0lBQzlCLENBQUM7SUF0UkQsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsUUFBUSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUUzRTtJQUNILENBQUM7SUFDRCxXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUNuQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQ2xCLFFBQVEsRUFDUixNQUFNLEVBQ04sUUFBUSxFQUNSLEVBQUUsQ0FDSCxDQUFBO1FBQ0QsOERBQThEO1FBQzlELDBEQUEwRDtRQUMxRCxnQ0FBZ0M7UUFDaEMsY0FBYztRQUNkLEtBQUs7SUFDUCxDQUFDO0lBWUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTywrQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQTtJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFBO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWU7UUFDYixPQUFPLElBQUEsNEJBQW9CLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzFDLENBQUM7SUFFRDs7T0FFRztJQUNILFlBQVk7UUFDVixPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVU7UUFDUixPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVM7UUFDUCxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzdDLENBQUM7SUFFRDs7T0FFRztJQUNILFdBQVc7UUFDVCxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFDRDs7T0FFRztJQUNILGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUE7SUFDeEIsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUV4QyxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDM0QsTUFBTSxJQUFJLEVBQUUsQ0FBQTtRQUVaLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUM3RCxNQUFNLElBQUksQ0FBQyxDQUFBO1FBRVgsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzNELE1BQU0sSUFBSSxDQUFDLENBQUE7UUFFWCxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDMUQsTUFBTSxJQUFJLENBQUMsQ0FBQTtRQUVYLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUM3RCxNQUFNLElBQUksRUFBRSxDQUFBO1FBRVosTUFBTSxFQUFFLEdBQWUsSUFBSSxhQUFVLEVBQUUsQ0FBQTtRQUN2QyxNQUFNLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO1FBQ3pELElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFBO1FBRXBCLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE1BQU0sU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUUxQyxNQUFNLEtBQUssR0FDVCxTQUFTLENBQUMsTUFBTTtZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNO1lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNO1lBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFBO1FBRW5DLE1BQU0sSUFBSSxHQUFhO1lBQ3JCLFNBQVM7WUFDVCxJQUFJLENBQUMsTUFBTTtZQUNYLElBQUksQ0FBQyxTQUFTO1lBQ2QsSUFBSSxDQUFDLE9BQU87WUFDWixJQUFJLENBQUMsTUFBTTtZQUNYLElBQUksQ0FBQyxRQUFRO1lBQ2IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUU7U0FDM0IsQ0FBQTtRQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDbkMsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLHVCQUF1QixHQUMzQixJQUFJLG9CQUFvQixFQUFFLENBQUE7UUFDNUIsdUJBQXVCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ25ELE9BQU8sdUJBQStCLENBQUE7SUFDeEMsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDbEQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsZUFBZSxDQUFDLFVBQWtCLEVBQUUsT0FBZTtRQUNqRCxNQUFNLFlBQVksR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzVDLFlBQVksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUMxQyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUU3QyxNQUFNLE1BQU0sR0FBVyxJQUFJLGVBQU0sRUFBRSxDQUFBO1FBQ25DLE1BQU0sQ0FBQyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDakMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDOUIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNwQixNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3JELENBQUM7SUFFRCxvQkFBb0I7UUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQsZUFBZTtRQUNiLE9BQU8sK0JBQW1CLENBQUMsY0FBYyxDQUFBO0lBQzNDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsSUFBSSxDQUFDLEdBQVcsRUFBRSxFQUFZO1FBQzVCLE1BQU0sS0FBSyxHQUFpQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUMvQyxNQUFNLE9BQU8sR0FBYSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7UUFDM0MsSUFBSSxJQUFJLEdBQWUsSUFBQSx3QkFBcUIsRUFBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQTtRQUNwRSxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE9BQU8sR0FBVyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sR0FBRyxHQUFjLElBQUksa0JBQVMsRUFBRSxDQUFBO1lBQ3RDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN2QjtRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFaEIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7WUFDcEIsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDL0MsTUFBTSxPQUFPLEdBQVcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN6QyxNQUFNLEdBQUcsR0FBYyxJQUFJLGtCQUFTLEVBQUUsQ0FBQTtZQUN0QyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNqQjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztDQW9ERjtBQTNSRCxvREEyUkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1BZGRTdWJuZXRWYWxpZGF0b3JUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsLCBTaWdJZHgsIFNpZ25hdHVyZSB9IGZyb20gXCIuLi8uLi9jb21tb25cIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcywgU3VibmV0QXV0aCB9IGZyb20gXCIuXCJcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBidWZmZXJUb05vZGVJRFN0cmluZyB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEFkZFN1Ym5ldFZhbGlkYXRvclR4IHRyYW5zYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQWRkU3VibmV0VmFsaWRhdG9yVHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBZGRTdWJuZXRWYWxpZGF0b3JUeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5BRERTVUJORVRWQUxJREFUT1JUWFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzdWJuZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuc3VibmV0SUQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIilcbiAgICAgIC8vIGV4cG9ydE91dHM6IHRoaXMuZXhwb3J0T3V0cy5tYXAoKGUpID0+IGUuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnN1Ym5ldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wic3VibmV0SURcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiY2I1OFwiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDMyXG4gICAgKVxuICAgIC8vIHRoaXMuZXhwb3J0T3V0cyA9IGZpZWxkc1tcImV4cG9ydE91dHNcIl0ubWFwKChlOiBvYmplY3QpID0+IHtcbiAgICAvLyAgIGxldCBlbzogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgLy8gICBlby5kZXNlcmlhbGl6ZShlLCBlbmNvZGluZylcbiAgICAvLyAgIHJldHVybiBlb1xuICAgIC8vIH0pXG4gIH1cblxuICBwcm90ZWN0ZWQgbm9kZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMjApXG4gIHByb3RlY3RlZCBzdGFydFRpbWU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg4KVxuICBwcm90ZWN0ZWQgZW5kVGltZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXG4gIHByb3RlY3RlZCB3ZWlnaHQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg4KVxuICBwcm90ZWN0ZWQgc3VibmV0SUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIHN1Ym5ldEF1dGg6IFN1Ym5ldEF1dGhcbiAgcHJvdGVjdGVkIHNpZ0NvdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdID0gW10gLy8gaWR4cyBvZiBzdWJuZXQgYXV0aCBzaWduZXJzXG4gIHByb3RlY3RlZCB3aXRoTm9kZVNpZzogYm9vbGVhbiA9IGZhbHNlXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiBQbGF0Zm9ybVZNQ29uc3RhbnRzLkFERFNVQk5FVFZBTElEQVRPUlRYXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgc3Rha2UgYW1vdW50LlxuICAgKi9cbiAgZ2V0Tm9kZUlEKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMubm9kZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBmb3IgdGhlIG5vZGVJRCBhbW91bnQuXG4gICAqL1xuICBnZXROb2RlSURTdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYnVmZmVyVG9Ob2RlSURTdHJpbmcodGhpcy5ub2RlSUQpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgc3RhcnRUaW1lLlxuICAgKi9cbiAgZ2V0U3RhcnRUaW1lKCk6IEJOIHtcbiAgICByZXR1cm4gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5zdGFydFRpbWUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgZW5kVGltZS5cbiAgICovXG4gIGdldEVuZFRpbWUoKTogQk4ge1xuICAgIHJldHVybiBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLmVuZFRpbWUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgd2VpZ2h0XG4gICAqL1xuICBnZXRXZWlnaHQoKTogQk4ge1xuICAgIHJldHVybiBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLndlaWdodClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdWJuZXRJRCBhcyBhIHN0cmluZ1xuICAgKi9cbiAgZ2V0U3VibmV0SUQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnN1Ym5ldElEKVxuICB9XG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdWJuZXRBdXRoXG4gICAqL1xuICBnZXRTdWJuZXRBdXRoKCk6IFN1Ym5ldEF1dGgge1xuICAgIHJldHVybiB0aGlzLnN1Ym5ldEF1dGhcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbQ3JlYXRlQ2hhaW5UeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbQWRkU3VibmV0VmFsaWRhdG9yVHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG5cbiAgICB0aGlzLm5vZGVJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIwKVxuICAgIG9mZnNldCArPSAyMFxuXG4gICAgdGhpcy5zdGFydFRpbWUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgIG9mZnNldCArPSA4XG5cbiAgICB0aGlzLmVuZFRpbWUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgIG9mZnNldCArPSA4XG5cbiAgICB0aGlzLndlaWdodCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXG4gICAgb2Zmc2V0ICs9IDhcblxuICAgIHRoaXMuc3VibmV0SUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICBvZmZzZXQgKz0gMzJcblxuICAgIGNvbnN0IHNhOiBTdWJuZXRBdXRoID0gbmV3IFN1Ym5ldEF1dGgoKVxuICAgIG9mZnNldCArPSBzYS5mcm9tQnVmZmVyKGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQpKVxuICAgIHRoaXMuc3VibmV0QXV0aCA9IHNhXG5cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0NyZWF0ZUNoYWluVHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG5cbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggK1xuICAgICAgdGhpcy5ub2RlSUQubGVuZ3RoICtcbiAgICAgIHRoaXMuc3RhcnRUaW1lLmxlbmd0aCArXG4gICAgICB0aGlzLmVuZFRpbWUubGVuZ3RoICtcbiAgICAgIHRoaXMud2VpZ2h0Lmxlbmd0aCArXG4gICAgICB0aGlzLnN1Ym5ldElELmxlbmd0aCArXG4gICAgICB0aGlzLnN1Ym5ldEF1dGgudG9CdWZmZXIoKS5sZW5ndGhcblxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW1xuICAgICAgc3VwZXJidWZmLFxuICAgICAgdGhpcy5ub2RlSUQsXG4gICAgICB0aGlzLnN0YXJ0VGltZSxcbiAgICAgIHRoaXMuZW5kVGltZSxcbiAgICAgIHRoaXMud2VpZ2h0LFxuICAgICAgdGhpcy5zdWJuZXRJRCxcbiAgICAgIHRoaXMuc3VibmV0QXV0aC50b0J1ZmZlcigpXG4gICAgXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3QWRkU3VibmV0VmFsaWRhdG9yVHg6IEFkZFN1Ym5ldFZhbGlkYXRvclR4ID1cbiAgICAgIG5ldyBBZGRTdWJuZXRWYWxpZGF0b3JUeCgpXG4gICAgbmV3QWRkU3VibmV0VmFsaWRhdG9yVHguZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld0FkZFN1Ym5ldFZhbGlkYXRvclR4IGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgQWRkU3VibmV0VmFsaWRhdG9yVHgoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIHNvdXJjZSBvZiB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhZGRTaWduYXR1cmVJZHgoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGRyZXNzSW5kZXg6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGFkZHJlc3NJbmRleC53cml0ZVVJbnRCRShhZGRyZXNzSWR4LCAwLCA0KVxuICAgIHRoaXMuc3VibmV0QXV0aC5hZGRBZGRyZXNzSW5kZXgoYWRkcmVzc0luZGV4KVxuXG4gICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBiLndyaXRlVUludDMyQkUoYWRkcmVzc0lkeCwgMClcbiAgICBzaWdpZHguZnJvbUJ1ZmZlcihiKVxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICBpbmNsdWRlTm9kZVNpZ25hdHVyZSgpOiB2b2lkIHtcbiAgICB0aGlzLndpdGhOb2RlU2lnID0gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIFtbU2lnSWR4XV0gZm9yIHRoaXMgW1tUWF1dXG4gICAqL1xuICBnZXRTaWdJZHhzKCk6IFNpZ0lkeFtdIHtcbiAgICByZXR1cm4gdGhpcy5zaWdJZHhzXG4gIH1cblxuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICpcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBrYyBBIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqL1xuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBzdXBlci5zaWduKG1zZywga2MpXG4gICAgY29uc3Qgc2lnaWR4czogU2lnSWR4W10gPSB0aGlzLmdldFNpZ0lkeHMoKVxuICAgIGxldCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKHRoaXMuZ2V0Q3JlZGVudGlhbElEKCkpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNpZ2lkeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4c1tgJHtpfWBdLmdldFNvdXJjZSgpKVxuICAgICAgY29uc3Qgc2lnbnZhbDogQnVmZmVyID0ga2V5cGFpci5zaWduKG1zZylcbiAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXG4gICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxuICAgICAgY3JlZC5hZGRTaWduYXR1cmUoc2lnKVxuICAgIH1cbiAgICBjcmVkcy5wdXNoKGNyZWQpXG5cbiAgICBpZiAodGhpcy53aXRoTm9kZVNpZykge1xuICAgICAgY3JlZCA9IGNyZWQuY3JlYXRlKClcbiAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkodGhpcy5ub2RlSUQpXG4gICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxuICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXG4gICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXG4gICAgICBjcmVkcy5wdXNoKGNyZWQpXG4gICAgfVxuICAgIHJldHVybiBjcmVkc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBBZGRTdWJuZXRWYWxpZGF0b3IgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIG5vZGVJRCBPcHRpb25hbC4gVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBPcHRpb25hbC4gVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgT3B0aW9uYWwuIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBVkFYIGlzIHJldHVybmVkKS5cbiAgICogQHBhcmFtIHdlaWdodCBPcHRpb25hbC4gV2VpZ2h0IG9mIHRoaXMgdmFsaWRhdG9yIHVzZWQgd2hlbiBzYW1wbGluZ1xuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIElEIG9mIHRoZSBzdWJuZXQgdGhpcyB2YWxpZGF0b3IgaXMgdmFsaWRhdGluZ1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBub2RlSUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBzdGFydFRpbWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGVuZFRpbWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIHdlaWdodDogQk4gPSB1bmRlZmluZWQsXG4gICAgc3VibmV0SUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aGlzLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OERlY29kZShzdWJuZXRJRClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGVJRCAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm5vZGVJRCA9IG5vZGVJRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIHN0YXJ0VGltZSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnN0YXJ0VGltZSA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKHN0YXJ0VGltZSwgOClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmRUaW1lICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuZW5kVGltZSA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGVuZFRpbWUsIDgpXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygd2VpZ2h0ICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMud2VpZ2h0ID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIod2VpZ2h0LCA4KVxuICAgIH1cblxuICAgIGNvbnN0IHN1Ym5ldEF1dGg6IFN1Ym5ldEF1dGggPSBuZXcgU3VibmV0QXV0aCgpXG4gICAgdGhpcy5zdWJuZXRBdXRoID0gc3VibmV0QXV0aFxuICB9XG59XG4iXX0=