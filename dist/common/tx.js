"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardTx = exports.StandardUnsignedTx = exports.StandardBaseTx = void 0;
/**
 * @packageDocumentation
 * @module Common-Transactions
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const input_1 = require("./input");
const output_1 = require("./output");
const constants_1 = require("../utils/constants");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const hex = "hex";
const decimalString = "decimalString";
const buffer = "Buffer";
/**
 * Class representing a base for all transactions.
 */
class StandardBaseTx extends serialization_1.Serializable {
    /**
     * Class representing a StandardBaseTx which is the foundation for all transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(networkID = constants_1.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined) {
        super();
        this._typeName = "StandardBaseTx";
        this._typeID = undefined;
        this.networkID = buffer_1.Buffer.alloc(4);
        this.blockchainID = buffer_1.Buffer.alloc(32);
        this.numouts = buffer_1.Buffer.alloc(4);
        this.numins = buffer_1.Buffer.alloc(4);
        this.memo = buffer_1.Buffer.alloc(0);
        this.networkID.writeUInt32BE(networkID, 0);
        this.blockchainID = blockchainID;
        if (typeof memo != "undefined") {
            this.memo = memo;
        }
        if (typeof ins !== "undefined" && typeof outs !== "undefined") {
            this.numouts.writeUInt32BE(outs.length, 0);
            this.outs = outs.sort(output_1.StandardTransferableOutput.comparator());
            this.numins.writeUInt32BE(ins.length, 0);
            this.ins = ins.sort(input_1.StandardTransferableInput.comparator());
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { networkID: serialization.encoder(this.networkID, encoding, buffer, decimalString), blockchainID: serialization.encoder(this.blockchainID, encoding, buffer, cb58), outs: this.outs.map((o) => o.serialize(encoding)), ins: this.ins.map((i) => i.serialize(encoding)), memo: serialization.encoder(this.memo, encoding, buffer, hex) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.networkID = serialization.decoder(fields["networkID"], encoding, decimalString, buffer, 4);
        this.blockchainID = serialization.decoder(fields["blockchainID"], encoding, cb58, buffer, 32);
        this.memo = serialization.decoder(fields["memo"], encoding, hex, buffer);
    }
    /**
     * Returns the NetworkID as a number
     */
    getNetworkID() {
        return this.networkID.readUInt32BE(0);
    }
    /**
     * Returns the Buffer representation of the BlockchainID
     */
    getBlockchainID() {
        return this.blockchainID;
    }
    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the memo
     */
    getMemo() {
        return this.memo;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardBaseTx]].
     */
    toBuffer() {
        this.outs.sort(output_1.StandardTransferableOutput.comparator());
        this.ins.sort(input_1.StandardTransferableInput.comparator());
        this.numouts.writeUInt32BE(this.outs.length, 0);
        this.numins.writeUInt32BE(this.ins.length, 0);
        let bsize = this.networkID.length + this.blockchainID.length + this.numouts.length;
        const barr = [this.networkID, this.blockchainID, this.numouts];
        for (let i = 0; i < this.outs.length; i++) {
            const b = this.outs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        barr.push(this.numins);
        bsize += this.numins.length;
        for (let i = 0; i < this.ins.length; i++) {
            const b = this.ins[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        let memolen = buffer_1.Buffer.alloc(4);
        memolen.writeUInt32BE(this.memo.length, 0);
        barr.push(memolen);
        bsize += 4;
        barr.push(this.memo);
        bsize += this.memo.length;
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Returns a base-58 representation of the [[StandardBaseTx]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    toStringHex() {
        return `0x${bintools.addChecksum(this.toBuffer()).toString("hex")}`;
    }
}
exports.StandardBaseTx = StandardBaseTx;
/**
 * Class representing an unsigned transaction.
 */
class StandardUnsignedTx extends serialization_1.Serializable {
    constructor(transaction = undefined, codecID = 0) {
        super();
        this._typeName = "StandardUnsignedTx";
        this._typeID = undefined;
        this.codecID = 0;
        this.codecID = codecID;
        this.transaction = transaction;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { codecID: serialization.encoder(this.codecID, encoding, "number", "decimalString", 2), transaction: this.transaction.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.codecID = serialization.decoder(fields["codecID"], encoding, "decimalString", "number");
    }
    /**
     * Returns the CodecID as a number
     */
    getCodecID() {
        return this.codecID;
    }
    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
     */
    getCodecIDBuffer() {
        let codecBuf = buffer_1.Buffer.alloc(2);
        codecBuf.writeUInt16BE(this.codecID, 0);
        return codecBuf;
    }
    /**
     * Returns the inputTotal as a BN
     */
    getInputTotal(assetID) {
        const ins = this.getTransaction().getIns();
        const aIDHex = assetID.toString("hex");
        let total = new bn_js_1.default(0);
        for (let i = 0; i < ins.length; i++) {
            // only check StandardAmountInputs
            if (ins[`${i}`].getInput() instanceof input_1.StandardAmountInput &&
                aIDHex === ins[`${i}`].getAssetID().toString("hex")) {
                const input = ins[`${i}`].getInput();
                total = total.add(input.getAmount());
            }
        }
        return total;
    }
    /**
     * Returns the outputTotal as a BN
     */
    getOutputTotal(assetID) {
        const outs = this.getTransaction().getTotalOuts();
        const aIDHex = assetID.toString("hex");
        let total = new bn_js_1.default(0);
        for (let i = 0; i < outs.length; i++) {
            const inner = outs[`${i}`].getOutput();
            const innerOut = inner instanceof output_1.StandardParseableOutput ? inner.getOutput() : inner;
            // only check StandardAmountOutput
            if (innerOut instanceof output_1.StandardAmountOutput &&
                aIDHex === outs[`${i}`].getAssetID().toString("hex")) {
                total = total.add(innerOut.getAmount());
            }
        }
        return total;
    }
    /**
     * Returns the number of burned tokens as a BN
     */
    getBurn(assetID) {
        return this.getInputTotal(assetID).sub(this.getOutputTotal(assetID));
    }
    toBuffer() {
        const codecBuf = buffer_1.Buffer.alloc(2);
        codecBuf.writeUInt16BE(this.transaction.getCodecID(), 0);
        const txtype = buffer_1.Buffer.alloc(4);
        txtype.writeUInt32BE(this.transaction.getTxType(), 0);
        const basebuff = this.transaction.toBuffer();
        return buffer_1.Buffer.concat([codecBuf, txtype, basebuff], codecBuf.length + txtype.length + basebuff.length);
    }
}
exports.StandardUnsignedTx = StandardUnsignedTx;
/**
 * Class representing a signed transaction.
 */
class StandardTx extends serialization_1.Serializable {
    /**
     * Class representing a signed transaction.
     *
     * @param unsignedTx Optional [[StandardUnsignedTx]]
     * @param signatures Optional array of [[Credential]]s
     */
    constructor(unsignedTx = undefined, credentials = undefined) {
        super();
        this._typeName = "StandardTx";
        this._typeID = undefined;
        this.unsignedTx = undefined;
        this.credentials = [];
        if (typeof unsignedTx !== "undefined") {
            this.unsignedTx = unsignedTx;
            if (typeof credentials !== "undefined") {
                this.credentials = credentials;
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { unsignedTx: this.unsignedTx.serialize(encoding), credentials: this.credentials.map((c) => c.serialize(encoding)) });
    }
    /**
     * Returns the [[Credential[]]]
     */
    getCredentials() {
        return this.credentials;
    }
    /**
     * Returns the [[StandardUnsignedTx]]
     */
    getUnsignedTx() {
        return this.unsignedTx;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTx]].
     */
    toBuffer() {
        const tx = this.unsignedTx.getTransaction();
        const codecID = tx.getCodecID();
        const txbuff = this.unsignedTx.toBuffer();
        let bsize = txbuff.length;
        const credlen = buffer_1.Buffer.alloc(4);
        credlen.writeUInt32BE(this.credentials.length, 0);
        const barr = [txbuff, credlen];
        bsize += credlen.length;
        for (let i = 0; i < this.credentials.length; i++) {
            this.credentials[`${i}`].setCodecID(codecID);
            const credID = buffer_1.Buffer.alloc(4);
            credID.writeUInt32BE(this.credentials[`${i}`].getCredentialID(), 0);
            barr.push(credID);
            bsize += credID.length;
            const credbuff = this.credentials[`${i}`].toBuffer();
            bsize += credbuff.length;
            barr.push(credbuff);
        }
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Takes a base-58 string containing an [[StandardTx]], parses it, populates the class, and returns the length of the Tx in bytes.
     *
     * @param serialized A base-58 string containing a raw [[StandardTx]]
     *
     * @returns The length of the raw [[StandardTx]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized) {
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a cb58 representation of the [[StandardTx]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    toStringHex() {
        return `0x${bintools.addChecksum(this.toBuffer()).toString("hex")}`;
    }
}
exports.StandardTx = StandardTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL3R4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFFeEMsa0RBQXNCO0FBRXRCLG1DQUF3RTtBQUN4RSxxQ0FJaUI7QUFDakIsa0RBQXFEO0FBQ3JELDBEQUsrQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxJQUFJLEdBQW1CLE1BQU0sQ0FBQTtBQUNuQyxNQUFNLEdBQUcsR0FBbUIsS0FBSyxDQUFBO0FBQ2pDLE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFDckQsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2Qzs7R0FFRztBQUNILE1BQXNCLGNBR3BCLFNBQVEsNEJBQVk7SUEwSnBCOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQXFDLFNBQVMsRUFDOUMsTUFBbUMsU0FBUyxFQUM1QyxPQUFlLFNBQVM7UUFFeEIsS0FBSyxFQUFFLENBQUE7UUF6S0MsY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUEyQ25CLGNBQVMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ25DLGlCQUFZLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN2QyxZQUFPLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVqQyxXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxD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LENBQUE7WUFDakIsS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUE7WUFDdEIsTUFBTSxRQUFRLEdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDNUQsS0FBSyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUE7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtTQUNwQjtRQUNELE1BQU0sSUFBSSxHQUFXLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQy9DLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILFVBQVUsQ0FBQyxVQUFrQjtRQUMzQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFFBQVE7UUFDTixPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLEtBQUssUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQTtJQUNyRSxDQUFDO0NBb0JGO0FBakhELGdDQWlIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIENvbW1vbi1UcmFuc2FjdGlvbnNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBTaWduZXJLZXlDaGFpbiwgU2lnbmVyS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcbmltcG9ydCB7IFN0YW5kYXJkQW1vdW50SW5wdXQsIFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dFwiXG5pbXBvcnQge1xuICBTdGFuZGFyZEFtb3VudE91dHB1dCxcbiAgU3RhbmRhcmRQYXJzZWFibGVPdXRwdXQsXG4gIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0XG59IGZyb20gXCIuL291dHB1dFwiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQge1xuICBTZXJpYWxpemFibGUsXG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZyxcbiAgU2VyaWFsaXplZFR5cGVcbn0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuY29uc3QgY2I1ODogU2VyaWFsaXplZFR5cGUgPSBcImNiNThcIlxuY29uc3QgaGV4OiBTZXJpYWxpemVkVHlwZSA9IFwiaGV4XCJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcbmNvbnN0IGJ1ZmZlcjogU2VyaWFsaXplZFR5cGUgPSBcIkJ1ZmZlclwiXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgYmFzZSBmb3IgYWxsIHRyYW5zYWN0aW9ucy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkQmFzZVR4PFxuICBLUENsYXNzIGV4dGVuZHMgU2lnbmVyS2V5UGFpcixcbiAgS0NDbGFzcyBleHRlbmRzIFNpZ25lcktleUNoYWluXG4+IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRCYXNlVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgY29uc3QgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIG5ldHdvcmtJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLm5ldHdvcmtJRCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgZGVjaW1hbFN0cmluZ1xuICAgICAgKSxcbiAgICAgIGJsb2NrY2hhaW5JRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5JRCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgY2I1OFxuICAgICAgKSxcbiAgICAgIG91dHM6IHRoaXMub3V0cy5tYXAoKG8pID0+IG8uc2VyaWFsaXplKGVuY29kaW5nKSksXG4gICAgICBpbnM6IHRoaXMuaW5zLm1hcCgoaSkgPT4gaS5zZXJpYWxpemUoZW5jb2RpbmcpKSxcbiAgICAgIG1lbW86IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLm1lbW8sIGVuY29kaW5nLCBidWZmZXIsIGhleClcbiAgICB9XG4gIH1cblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMubmV0d29ya0lEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wibmV0d29ya0lEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBkZWNpbWFsU3RyaW5nLFxuICAgICAgYnVmZmVyLFxuICAgICAgNFxuICAgIClcbiAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImJsb2NrY2hhaW5JRFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgY2I1OCxcbiAgICAgIGJ1ZmZlcixcbiAgICAgIDMyXG4gICAgKVxuICAgIHRoaXMubWVtbyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihmaWVsZHNbXCJtZW1vXCJdLCBlbmNvZGluZywgaGV4LCBidWZmZXIpXG4gIH1cblxuICBwcm90ZWN0ZWQgbmV0d29ya0lEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICBwcm90ZWN0ZWQgbnVtb3V0czogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBvdXRzOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdXG4gIHByb3RlY3RlZCBudW1pbnM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgaW5zOiBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0W11cbiAgcHJvdGVjdGVkIG1lbW86IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygwKVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tTdGFuZGFyZEJhc2VUeF1dXG4gICAqL1xuICBhYnN0cmFjdCBnZXRUeFR5cGUoKTogbnVtYmVyXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIE5ldHdvcmtJRCBhcyBhIG51bWJlclxuICAgKi9cbiAgZ2V0TmV0d29ya0lEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubmV0d29ya0lELnJlYWRVSW50MzJCRSgwKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIEJ1ZmZlciByZXByZXNlbnRhdGlvbiBvZiB0aGUgQmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICovXG4gIGFic3RyYWN0IGdldElucygpOiBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0W11cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKi9cbiAgYWJzdHJhY3QgZ2V0T3V0cygpOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIGNvbWJpbmVkIHRvdGFsIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICovXG4gIGFic3RyYWN0IGdldFRvdGFsT3V0cygpOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtZW1vXG4gICAqL1xuICBnZXRNZW1vKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMubWVtb1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZEJhc2VUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICB0aGlzLm91dHMuc29ydChTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dC5jb21wYXJhdG9yKCkpXG4gICAgdGhpcy5pbnMuc29ydChTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSlcbiAgICB0aGlzLm51bW91dHMud3JpdGVVSW50MzJCRSh0aGlzLm91dHMubGVuZ3RoLCAwKVxuICAgIHRoaXMubnVtaW5zLndyaXRlVUludDMyQkUodGhpcy5pbnMubGVuZ3RoLCAwKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHRoaXMubmV0d29ya0lELmxlbmd0aCArIHRoaXMuYmxvY2tjaGFpbklELmxlbmd0aCArIHRoaXMubnVtb3V0cy5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLm5ldHdvcmtJRCwgdGhpcy5ibG9ja2NoYWluSUQsIHRoaXMubnVtb3V0c11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5vdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0aGlzLm91dHNbYCR7aX1gXS50b0J1ZmZlcigpXG4gICAgICBiYXJyLnB1c2goYilcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXG4gICAgfVxuICAgIGJhcnIucHVzaCh0aGlzLm51bWlucylcbiAgICBic2l6ZSArPSB0aGlzLm51bWlucy5sZW5ndGhcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5pbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMuaW5zW2Ake2l9YF0udG9CdWZmZXIoKVxuICAgICAgYmFyci5wdXNoKGIpXG4gICAgICBic2l6ZSArPSBiLmxlbmd0aFxuICAgIH1cbiAgICBsZXQgbWVtb2xlbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgbWVtb2xlbi53cml0ZVVJbnQzMkJFKHRoaXMubWVtby5sZW5ndGgsIDApXG4gICAgYmFyci5wdXNoKG1lbW9sZW4pXG4gICAgYnNpemUgKz0gNFxuICAgIGJhcnIucHVzaCh0aGlzLm1lbW8pXG4gICAgYnNpemUgKz0gdGhpcy5tZW1vLmxlbmd0aFxuICAgIGNvbnN0IGJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gICAgcmV0dXJuIGJ1ZmZcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZEJhc2VUeF1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgdG9TdHJpbmdIZXgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDB4JHtiaW50b29scy5hZGRDaGVja3N1bSh0aGlzLnRvQnVmZmVyKCkpLnRvU3RyaW5nKFwiaGV4XCIpfWBcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICovXG4gIGFic3RyYWN0IHNpZ24obXNnOiBCdWZmZXIsIGtjOiBTaWduZXJLZXlDaGFpbik6IENyZWRlbnRpYWxbXVxuXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcblxuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXG5cbiAgYWJzdHJhY3Qgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogdGhpc1xuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZEJhc2VUeCB3aGljaCBpcyB0aGUgZm91bmRhdGlvbiBmb3IgYWxsIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMubmV0d29ya0lELndyaXRlVUludDMyQkUobmV0d29ya0lELCAwKVxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEXG4gICAgaWYgKHR5cGVvZiBtZW1vICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubWVtbyA9IG1lbW9cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGlucyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2Ygb3V0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5udW1vdXRzLndyaXRlVUludDMyQkUob3V0cy5sZW5ndGgsIDApXG4gICAgICB0aGlzLm91dHMgPSBvdXRzLnNvcnQoU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQuY29tcGFyYXRvcigpKVxuICAgICAgdGhpcy5udW1pbnMud3JpdGVVSW50MzJCRShpbnMubGVuZ3RoLCAwKVxuICAgICAgdGhpcy5pbnMgPSBpbnMuc29ydChTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSlcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFVuc2lnbmVkVHg8XG4gIEtQQ2xhc3MgZXh0ZW5kcyBTaWduZXJLZXlQYWlyLFxuICBLQ0NsYXNzIGV4dGVuZHMgU2lnbmVyS2V5Q2hhaW4sXG4gIFNCVHggZXh0ZW5kcyBTdGFuZGFyZEJhc2VUeDxLUENsYXNzLCBLQ0NsYXNzPlxuPiBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkVW5zaWduZWRUeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGNvZGVjSUQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5jb2RlY0lELFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJudW1iZXJcIixcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICAgIDJcbiAgICAgICksXG4gICAgICB0cmFuc2FjdGlvbjogdGhpcy50cmFuc2FjdGlvbi5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmNvZGVjSUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJjb2RlY0lEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwibnVtYmVyXCJcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgY29kZWNJRDogbnVtYmVyID0gMFxuICBwcm90ZWN0ZWQgdHJhbnNhY3Rpb246IFNCVHhcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgQ29kZWNJRCBhcyBhIG51bWJlclxuICAgKi9cbiAgZ2V0Q29kZWNJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvZGVjSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ29kZWNJRFxuICAgKi9cbiAgZ2V0Q29kZWNJREJ1ZmZlcigpOiBCdWZmZXIge1xuICAgIGxldCBjb2RlY0J1ZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXG4gICAgY29kZWNCdWYud3JpdGVVSW50MTZCRSh0aGlzLmNvZGVjSUQsIDApXG4gICAgcmV0dXJuIGNvZGVjQnVmXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5wdXRUb3RhbCBhcyBhIEJOXG4gICAqL1xuICBnZXRJbnB1dFRvdGFsKGFzc2V0SUQ6IEJ1ZmZlcik6IEJOIHtcbiAgICBjb25zdCBpbnM6IFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHRoaXMuZ2V0VHJhbnNhY3Rpb24oKS5nZXRJbnMoKVxuICAgIGNvbnN0IGFJREhleDogc3RyaW5nID0gYXNzZXRJRC50b1N0cmluZyhcImhleFwiKVxuICAgIGxldCB0b3RhbDogQk4gPSBuZXcgQk4oMClcblxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIG9ubHkgY2hlY2sgU3RhbmRhcmRBbW91bnRJbnB1dHNcbiAgICAgIGlmIChcbiAgICAgICAgaW5zW2Ake2l9YF0uZ2V0SW5wdXQoKSBpbnN0YW5jZW9mIFN0YW5kYXJkQW1vdW50SW5wdXQgJiZcbiAgICAgICAgYUlESGV4ID09PSBpbnNbYCR7aX1gXS5nZXRBc3NldElEKCkudG9TdHJpbmcoXCJoZXhcIilcbiAgICAgICkge1xuICAgICAgICBjb25zdCBpbnB1dDogU3RhbmRhcmRBbW91bnRJbnB1dCA9IGluc1tcbiAgICAgICAgICBgJHtpfWBcbiAgICAgICAgXS5nZXRJbnB1dCgpIGFzIFN0YW5kYXJkQW1vdW50SW5wdXRcbiAgICAgICAgdG90YWwgPSB0b3RhbC5hZGQoaW5wdXQuZ2V0QW1vdW50KCkpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0b3RhbFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG91dHB1dFRvdGFsIGFzIGEgQk5cbiAgICovXG4gIGdldE91dHB1dFRvdGFsKGFzc2V0SUQ6IEJ1ZmZlcik6IEJOIHtcbiAgICBjb25zdCBvdXRzOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFtdID1cbiAgICAgIHRoaXMuZ2V0VHJhbnNhY3Rpb24oKS5nZXRUb3RhbE91dHMoKVxuICAgIGNvbnN0IGFJREhleDogc3RyaW5nID0gYXNzZXRJRC50b1N0cmluZyhcImhleFwiKVxuICAgIGxldCB0b3RhbDogQk4gPSBuZXcgQk4oMClcblxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBvdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbm5lciA9IG91dHNbYCR7aX1gXS5nZXRPdXRwdXQoKVxuICAgICAgY29uc3QgaW5uZXJPdXQgPVxuICAgICAgICBpbm5lciBpbnN0YW5jZW9mIFN0YW5kYXJkUGFyc2VhYmxlT3V0cHV0ID8gaW5uZXIuZ2V0T3V0cHV0KCkgOiBpbm5lclxuICAgICAgLy8gb25seSBjaGVjayBTdGFuZGFyZEFtb3VudE91dHB1dFxuICAgICAgaWYgKFxuICAgICAgICBpbm5lck91dCBpbnN0YW5jZW9mIFN0YW5kYXJkQW1vdW50T3V0cHV0ICYmXG4gICAgICAgIGFJREhleCA9PT0gb3V0c1tgJHtpfWBdLmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKVxuICAgICAgKSB7XG4gICAgICAgIHRvdGFsID0gdG90YWwuYWRkKGlubmVyT3V0LmdldEFtb3VudCgpKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG90YWxcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYnVybmVkIHRva2VucyBhcyBhIEJOXG4gICAqL1xuICBnZXRCdXJuKGFzc2V0SUQ6IEJ1ZmZlcik6IEJOIHtcbiAgICByZXR1cm4gdGhpcy5nZXRJbnB1dFRvdGFsKGFzc2V0SUQpLnN1Yih0aGlzLmdldE91dHB1dFRvdGFsKGFzc2V0SUQpKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIFRyYW5zYWN0aW9uXG4gICAqL1xuICBhYnN0cmFjdCBnZXRUcmFuc2FjdGlvbigpOiBTQlR4XG5cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IGNvZGVjQnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMilcbiAgICBjb2RlY0J1Zi53cml0ZVVJbnQxNkJFKHRoaXMudHJhbnNhY3Rpb24uZ2V0Q29kZWNJRCgpLCAwKVxuICAgIGNvbnN0IHR4dHlwZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgdHh0eXBlLndyaXRlVUludDMyQkUodGhpcy50cmFuc2FjdGlvbi5nZXRUeFR5cGUoKSwgMClcbiAgICBjb25zdCBiYXNlYnVmZiA9IHRoaXMudHJhbnNhY3Rpb24udG9CdWZmZXIoKVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFxuICAgICAgW2NvZGVjQnVmLCB0eHR5cGUsIGJhc2VidWZmXSxcbiAgICAgIGNvZGVjQnVmLmxlbmd0aCArIHR4dHlwZS5sZW5ndGggKyBiYXNlYnVmZi5sZW5ndGhcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgdGhpcyBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBzaWduZWQgW1tTdGFuZGFyZFR4XV1cbiAgICpcbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQSBzaWduZWQgW1tTdGFuZGFyZFR4XV1cbiAgICovXG4gIGFic3RyYWN0IHNpZ24oXG4gICAga2M6IEtDQ2xhc3NcbiAgKTogU3RhbmRhcmRUeDxLUENsYXNzLCBLQ0NsYXNzLCBTdGFuZGFyZFVuc2lnbmVkVHg8S1BDbGFzcywgS0NDbGFzcywgU0JUeD4+XG5cbiAgY29uc3RydWN0b3IodHJhbnNhY3Rpb246IFNCVHggPSB1bmRlZmluZWQsIGNvZGVjSUQ6IG51bWJlciA9IDApIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5jb2RlY0lEID0gY29kZWNJRFxuICAgIHRoaXMudHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvblxuICB9XG59XG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgc2lnbmVkIHRyYW5zYWN0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRUeDxcbiAgS1BDbGFzcyBleHRlbmRzIFNpZ25lcktleVBhaXIsXG4gIEtDQ2xhc3MgZXh0ZW5kcyBTaWduZXJLZXlDaGFpbixcbiAgU1VCVHggZXh0ZW5kcyBTdGFuZGFyZFVuc2lnbmVkVHg8XG4gICAgS1BDbGFzcyxcbiAgICBLQ0NsYXNzLFxuICAgIFN0YW5kYXJkQmFzZVR4PEtQQ2xhc3MsIEtDQ2xhc3M+XG4gID5cbj4gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgdW5zaWduZWRUeDogdGhpcy51bnNpZ25lZFR4LnNlcmlhbGl6ZShlbmNvZGluZyksXG4gICAgICBjcmVkZW50aWFsczogdGhpcy5jcmVkZW50aWFscy5tYXAoKGMpID0+IGMuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgdW5zaWduZWRUeDogU1VCVHggPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFsW10gPSBbXVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBbW0NyZWRlbnRpYWxbXV1dXG4gICAqL1xuICBnZXRDcmVkZW50aWFscygpOiBDcmVkZW50aWFsW10ge1xuICAgIHJldHVybiB0aGlzLmNyZWRlbnRpYWxzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgW1tTdGFuZGFyZFVuc2lnbmVkVHhdXVxuICAgKi9cbiAgZ2V0VW5zaWduZWRUeCgpOiBTVUJUeCB7XG4gICAgcmV0dXJuIHRoaXMudW5zaWduZWRUeFxuICB9XG5cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N0YW5kYXJkVHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgdHg6IFN0YW5kYXJkQmFzZVR4PEtQQ2xhc3MsIEtDQ2xhc3M+ID1cbiAgICAgIHRoaXMudW5zaWduZWRUeC5nZXRUcmFuc2FjdGlvbigpXG4gICAgY29uc3QgY29kZWNJRDogbnVtYmVyID0gdHguZ2V0Q29kZWNJRCgpXG4gICAgY29uc3QgdHhidWZmOiBCdWZmZXIgPSB0aGlzLnVuc2lnbmVkVHgudG9CdWZmZXIoKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdHhidWZmLmxlbmd0aFxuICAgIGNvbnN0IGNyZWRsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGNyZWRsZW4ud3JpdGVVSW50MzJCRSh0aGlzLmNyZWRlbnRpYWxzLmxlbmd0aCwgMClcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0eGJ1ZmYsIGNyZWRsZW5dXG4gICAgYnNpemUgKz0gY3JlZGxlbi5sZW5ndGhcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5jcmVkZW50aWFscy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5jcmVkZW50aWFsc1tgJHtpfWBdLnNldENvZGVjSUQoY29kZWNJRClcbiAgICAgIGNvbnN0IGNyZWRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgICBjcmVkSUQud3JpdGVVSW50MzJCRSh0aGlzLmNyZWRlbnRpYWxzW2Ake2l9YF0uZ2V0Q3JlZGVudGlhbElEKCksIDApXG4gICAgICBiYXJyLnB1c2goY3JlZElEKVxuICAgICAgYnNpemUgKz0gY3JlZElELmxlbmd0aFxuICAgICAgY29uc3QgY3JlZGJ1ZmY6IEJ1ZmZlciA9IHRoaXMuY3JlZGVudGlhbHNbYCR7aX1gXS50b0J1ZmZlcigpXG4gICAgICBic2l6ZSArPSBjcmVkYnVmZi5sZW5ndGhcbiAgICAgIGJhcnIucHVzaChjcmVkYnVmZilcbiAgICB9XG4gICAgY29uc3QgYnVmZjogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgICByZXR1cm4gYnVmZlxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhbiBbW1N0YW5kYXJkVHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBUeCBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHNlcmlhbGl6ZWQgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbU3RhbmRhcmRUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1N0YW5kYXJkVHhdXVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCBmcm9tU3RyaW5ncywgaXQgZXhwZWN0cyB0aGUgc3RyaW5nIHRvIGJlIHNlcmlhbGl6ZWQgaW4gY2I1OCBmb3JtYXRcbiAgICovXG4gIGZyb21TdHJpbmcoc2VyaWFsaXplZDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNiNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcbiAgfVxuXG4gIHRvU3RyaW5nSGV4KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAweCR7YmludG9vbHMuYWRkQ2hlY2tzdW0odGhpcy50b0J1ZmZlcigpKS50b1N0cmluZyhcImhleFwiKX1gXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgc2lnbmVkIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdW5zaWduZWRUeCBPcHRpb25hbCBbW1N0YW5kYXJkVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBzaWduYXR1cmVzIE9wdGlvbmFsIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgdW5zaWduZWRUeDogU1VCVHggPSB1bmRlZmluZWQsXG4gICAgY3JlZGVudGlhbHM6IENyZWRlbnRpYWxbXSA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHR5cGVvZiB1bnNpZ25lZFR4ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnVuc2lnbmVkVHggPSB1bnNpZ25lZFR4XG4gICAgICBpZiAodHlwZW9mIGNyZWRlbnRpYWxzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBjcmVkZW50aWFsc1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19