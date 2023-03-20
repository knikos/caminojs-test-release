"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardAmountInput = exports.StandardTransferableInput = exports.StandardParseableInput = exports.Input = exports.BaseInputComparator = void 0;
/**
 * @packageDocumentation
 * @module Common-Inputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const credentials_1 = require("./credentials");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const BaseInputComparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getInputID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getInputID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
exports.BaseInputComparator = BaseInputComparator;
class Input extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Input";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
         * Returns the array of [[SigIdx]] for this [[Input]]
         */
        this.getSigIdxs = () => this.sigIdxs;
        /**
         * Sets the array of [[SigIdx]] for this [[Input]]
         * Normaly only called for Multisig replacement
         */
        this.setSigIdxs = (sigIdxs) => {
            this.sigIdxs = sigIdxs;
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
        /**
         * Creates and adds a [[SigIdx]] to the [[Input]].
         *
         * @param addressIdx The index of the address to reference in the signatures
         * @param address The address of the source of the signature
         */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigIdxs: this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    getInput() {
        return this;
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 representation of the [[Input]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Input = Input;
class StandardParseableInput extends serialization_1.Serializable {
    /**
     * Class representing an [[StandardParseableInput]] for a transaction.
     *
     * @param input A number representing the InputID of the [[StandardParseableInput]]
     */
    constructor(input = undefined) {
        super();
        this._typeName = "StandardParseableInput";
        this._typeID = undefined;
        this.getInput = () => this.input;
        this.getSigIdxs = () => {
            return this.input.getSigIdxs();
        };
        this.setSigIdxs = (sigIdxs) => this.input.setSigIdxs(sigIdxs);
        this.input = input;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { input: this.input.serialize(encoding) });
    }
    addSignatureIdx(addressIdx, address) {
        this.input.addSignatureIdx(addressIdx, address);
    }
    toBuffer() {
        const inbuff = this.input.toBuffer();
        const inid = buffer_1.Buffer.alloc(4);
        inid.writeUInt32BE(this.input.getInputID(), 0);
        const barr = [inid, inbuff];
        return buffer_1.Buffer.concat(barr, inid.length + inbuff.length);
    }
}
exports.StandardParseableInput = StandardParseableInput;
/**
 * Returns a function used to sort an array of [[StandardParseableInput]]s
 */
StandardParseableInput.comparator = () => (a, b) => {
    const sorta = a.toBuffer();
    const sortb = b.toBuffer();
    return buffer_1.Buffer.compare(sorta, sortb);
};
class StandardTransferableInput extends StandardParseableInput {
    /**
     * Class representing an [[StandardTransferableInput]] for a transaction.
     *
     * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
     * @param outputidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[StandardTransferableInput]]
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
     * @param input An [[Input]] to be made transferable
     */
    constructor(txid = undefined, outputidx = undefined, assetID = undefined, input = undefined) {
        super();
        this._typeName = "StandardTransferableInput";
        this._typeID = undefined;
        this.txid = buffer_1.Buffer.alloc(32);
        this.outputidx = buffer_1.Buffer.alloc(4);
        this.assetID = buffer_1.Buffer.alloc(32);
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
         */
        this.getTxID = () => this.txid;
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
         */
        this.getOutputIdx = () => this.outputidx;
        /**
         * Returns a base-58 string representation of the UTXOID this [[StandardTransferableInput]] references.
         */
        this.getUTXOID = () => bintools.bufferToB58(buffer_1.Buffer.concat([this.txid, this.outputidx]));
        /**
         * Returns the input.
         */
        this.getInput = () => this.input;
        /**
         * Returns the assetID of the input.
         */
        this.getAssetID = () => this.assetID;
        if (typeof txid !== undefined &&
            typeof outputidx !== undefined &&
            typeof assetID !== undefined &&
            input !== undefined) {
            this.input = input;
            this.txid = txid;
            this.outputidx = outputidx;
            this.assetID = assetID;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { txid: serialization.encoder(this.txid, encoding, "Buffer", "cb58"), outputidx: serialization.encoder(this.outputidx, encoding, "Buffer", "decimalString"), assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.txid = serialization.decoder(fields["txid"], encoding, "cb58", "Buffer", 32);
        this.outputidx = serialization.decoder(fields["outputidx"], encoding, "decimalString", "Buffer", 4);
        this.assetID = serialization.decoder(fields["assetID"], encoding, "cb58", "Buffer", 32);
        //input deserialization must be implmented in child classes
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTransferableInput]].
     */
    toBuffer() {
        const parseableBuff = super.toBuffer();
        const bsize = this.txid.length +
            this.outputidx.length +
            this.assetID.length +
            parseableBuff.length;
        const barr = [
            this.txid,
            this.outputidx,
            this.assetID,
            parseableBuff
        ];
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Returns a base-58 representation of the [[StandardTransferableInput]].
     */
    toString() {
        /* istanbul ignore next */
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.StandardTransferableInput = StandardTransferableInput;
/**
 * An [[Input]] class which specifies a token amount .
 */
class StandardAmountInput extends Input {
    /**
     * An [[AmountInput]] class which issues a payment on an assetID.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     */
    constructor(amount = undefined) {
        super();
        this._typeName = "StandardAmountInput";
        this._typeID = undefined;
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        /**
         * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getAmount = () => this.amountValue.clone();
        if (amount) {
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(amount, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { amount: serialization.encoder(this.amount, encoding, "Buffer", "decimalString", 8) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.amount = serialization.decoder(fields["amount"], encoding, "decimalString", "Buffer", 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[AmountInput]] and returns the size of the input.
     */
    fromBuffer(bytes, offset = 0) {
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
        offset += 8;
        return super.fromBuffer(bytes, offset);
    }
    /**
     * Returns the buffer representing the [[AmountInput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.amount.length + superbuff.length;
        const barr = [this.amount, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.StandardAmountInput = StandardAmountInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2lucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFDeEMsa0RBQXNCO0FBQ3RCLCtDQUFzQztBQUN0QywwREFJK0I7QUFFL0I7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBcUJ6RCxNQUFNLG1CQUFtQixHQUM5QixHQUFpRCxFQUFFLENBQ25ELENBQUMsQ0FBWSxFQUFFLENBQVksRUFBYyxFQUFFO0lBQ3pDLE1BQU0sTUFBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDdkMsTUFBTSxLQUFLLEdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBRWxDLE1BQU0sTUFBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDdkMsTUFBTSxLQUFLLEdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBRWxDLE1BQU0sS0FBSyxHQUFXLGVBQU0sQ0FBQyxNQUFNLENBQ2pDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FDN0IsQ0FBQTtJQUNELE1BQU0sS0FBSyxHQUFXLGVBQU0sQ0FBQyxNQUFNLENBQ2pDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FDN0IsQ0FBQTtJQUNELE9BQU8sZUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFlLENBQUE7QUFDbkQsQ0FBQyxDQUFBO0FBcEJVLFFBQUEsbUJBQW1CLHVCQW9CN0I7QUFFSCxNQUFzQixLQUFNLFNBQVEsNEJBQVk7SUFBaEQ7O1FBQ1ksY0FBUyxHQUFHLE9BQU8sQ0FBQTtRQUNuQixZQUFPLEdBQUcsU0FBUyxDQUFBO1FBbUJuQixhQUFRLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQyxZQUFPLEdBQWEsRUFBRSxDQUFBLENBQUMsNEJBQTRCO1FBUTdEOztXQUVHO1FBQ0gsZUFBVSxHQUFHLEdBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUE7UUFFekM7OztXQUdHO1FBQ0gsZUFBVSxHQUFHLENBQUMsT0FBaUIsRUFBRSxFQUFFO1lBQ2pDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3JELENBQUMsQ0FBQTtRQUlEOzs7OztXQUtHO1FBQ0gsb0JBQWUsR0FBRyxDQUFDLFVBQWtCLEVBQUUsT0FBZSxFQUFFLEVBQUU7WUFDeEQsTUFBTSxNQUFNLEdBQVcsSUFBSSxvQkFBTSxFQUFFLENBQUE7WUFDbkMsTUFBTSxDQUFDLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNqQyxDQUFDLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUM5QixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3BCLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDckQsQ0FBQyxDQUFBO0lBeUNILENBQUM7SUFqR0MsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQ3hEO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRTtZQUNqRCxJQUFJLElBQUksR0FBVyxJQUFJLG9CQUFNLEVBQUUsQ0FBQTtZQUMvQixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUM3QixPQUFPLElBQUksQ0FBQTtRQUNiLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDckQsQ0FBQztJQUtELFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFvQ0QsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUM1RCxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsTUFBTSxRQUFRLEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDdEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFDakIsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QyxNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFNLEVBQUUsQ0FBQTtZQUMzQixNQUFNLE9BQU8sR0FBVyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ3BFLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDMUIsTUFBTSxJQUFJLENBQUMsQ0FBQTtZQUNYLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQzFCO1FBQ0QsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ25ELElBQUksS0FBSyxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFBO1FBQ3hDLE1BQU0sSUFBSSxHQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3RDLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwRCxNQUFNLENBQUMsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ1osS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUE7U0FDbEI7UUFDRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDOUMsQ0FBQztDQU9GO0FBckdELHNCQXFHQztBQUVELE1BQXNCLHNCQUF1QixTQUFRLDRCQUFZO0lBbUQvRDs7OztPQUlHO0lBQ0gsWUFBWSxRQUFtQixTQUFTO1FBQ3RDLEtBQUssRUFBRSxDQUFBO1FBeERDLGNBQVMsR0FBRyx3QkFBd0IsQ0FBQTtRQUNwQyxZQUFPLEdBQUcsU0FBUyxDQUFBO1FBMEI3QixhQUFRLEdBQUcsR0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQTtRQU10QyxlQUFVLEdBQUcsR0FBYSxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQTtRQUNoQyxDQUFDLENBQUE7UUFFRCxlQUFVLEdBQUcsQ0FBQyxPQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQW9CaEUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7SUFDcEIsQ0FBQztJQXZERCxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQ3RDO0lBQ0gsQ0FBQztJQW9CRCxlQUFlLENBQUMsVUFBa0IsRUFBRSxPQUFlO1FBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNqRCxDQUFDO0lBV0QsUUFBUTtRQUNOLE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDNUMsTUFBTSxJQUFJLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNwQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDOUMsTUFBTSxJQUFJLEdBQWEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDckMsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUN6RCxDQUFDOztBQWpESCx3REE0REM7QUE5Q0M7O0dBRUc7QUFDSSxpQ0FBVSxHQUNmLEdBR2lCLEVBQUUsQ0FDbkIsQ0FBQyxDQUF5QixFQUFFLENBQXlCLEVBQWMsRUFBRTtJQUNuRSxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQzFCLE9BQU8sZUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFlLENBQUE7QUFDbkQsQ0FBQyxDQUFBO0FBb0NMLE1BQXNCLHlCQUEwQixTQUFRLHNCQUFzQjtJQXdHNUU7Ozs7Ozs7T0FPRztJQUNILFlBQ0UsT0FBZSxTQUFTLEVBQ3hCLFlBQW9CLFNBQVMsRUFDN0IsVUFBa0IsU0FBUyxFQUMzQixRQUFtQixTQUFTO1FBRTVCLEtBQUssRUFBRSxDQUFBO1FBckhDLGNBQVMsR0FBRywyQkFBMkIsQ0FBQTtRQUN2QyxZQUFPLEdBQUcsU0FBUyxDQUFBO1FBMENuQixTQUFJLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUMvQixjQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuQyxZQUFPLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUU1Qzs7V0FFRztRQUNILFlBQU8sR0FBRyxHQUFzQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUU1RDs7V0FFRztRQUNILGlCQUFZLEdBQUcsR0FBc0MsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUE7UUFFdEU7O1dBRUc7UUFDSCxjQUFTLEdBQUcsR0FBVyxFQUFFLENBQ3ZCLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVsRTs7V0FFRztRQUNILGFBQVEsR0FBRyxHQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBRXRDOztXQUVHO1FBQ0gsZUFBVSxHQUFHLEdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUE7UUErQ3JDLElBQ0UsT0FBTyxJQUFJLEtBQUssU0FBUztZQUN6QixPQUFPLFNBQVMsS0FBSyxTQUFTO1lBQzlCLE9BQU8sT0FBTyxLQUFLLFNBQVM7WUFDNUIsS0FBSyxLQUFLLFNBQVMsRUFDbkI7WUFDQSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtZQUNsQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtZQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtTQUN2QjtJQUNILENBQUM7SUE5SEQsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsSUFBSSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUNsRSxTQUFTLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FDOUIsSUFBSSxDQUFDLFNBQVMsRUFDZCxRQUFRLEVBQ1IsUUFBUSxFQUNSLGVBQWUsQ0FDaEIsRUFDRCxPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQ3pFO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFDZCxRQUFRLEVBQ1IsTUFBTSxFQUNOLFFBQVEsRUFDUixFQUFFLENBQ0gsQ0FBQTtRQUNELElBQUksQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUNuQixRQUFRLEVBQ1IsZUFBZSxFQUNmLFFBQVEsRUFDUixDQUFDLENBQ0YsQ0FBQTtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDbEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUNqQixRQUFRLEVBQ1IsTUFBTSxFQUNOLFFBQVEsRUFDUixFQUFFLENBQ0gsQ0FBQTtRQUNELDJEQUEyRDtJQUM3RCxDQUFDO0lBa0NEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE1BQU0sYUFBYSxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUM5QyxNQUFNLEtBQUssR0FDVCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNO1lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNuQixhQUFhLENBQUMsTUFBTSxDQUFBO1FBQ3RCLE1BQU0sSUFBSSxHQUFhO1lBQ3JCLElBQUksQ0FBQyxJQUFJO1lBQ1QsSUFBSSxDQUFDLFNBQVM7WUFDZCxJQUFJLENBQUMsT0FBTztZQUNaLGFBQWE7U0FDZCxDQUFBO1FBQ0QsTUFBTSxJQUFJLEdBQVcsZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDL0MsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sMEJBQTBCO1FBQzFCLE9BQU8sUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0NBNkJGO0FBbklELDhEQW1JQztBQUVEOztHQUVHO0FBQ0gsTUFBc0IsbUJBQW9CLFNBQVEsS0FBSztJQXlEckQ7Ozs7T0FJRztJQUNILFlBQVksU0FBYSxTQUFTO1FBQ2hDLEtBQUssRUFBRSxDQUFBO1FBOURDLGNBQVMsR0FBRyxxQkFBcUIsQ0FBQTtRQUNqQyxZQUFPLEdBQUcsU0FBUyxDQUFBO1FBMkJuQixXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNoQyxnQkFBVyxHQUFPLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRXJDOztXQUVHO1FBQ0gsY0FBUyxHQUFHLEdBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUE7UUE2QjVDLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7WUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUNqRDtJQUNILENBQUM7SUFoRUQsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsTUFBTSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQzNCLElBQUksQ0FBQyxNQUFNLEVBQ1gsUUFBUSxFQUNSLFFBQVEsRUFDUixlQUFlLEVBQ2YsQ0FBQyxDQUNGLElBQ0Y7SUFDSCxDQUFDO0lBQ0QsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDakMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUNoQixRQUFRLEVBQ1IsZUFBZSxFQUNmLFFBQVEsRUFDUixDQUFDLENBQ0YsQ0FBQTtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDekQsQ0FBQztJQVVEOztPQUVHO0lBQ0gsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMxRCxJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZELE1BQU0sSUFBSSxDQUFDLENBQUE7UUFDWCxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQ3hDLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixNQUFNLFNBQVMsR0FBVyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDMUMsTUFBTSxLQUFLLEdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtRQUMzRCxNQUFNLElBQUksR0FBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDL0MsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0NBY0Y7QUFyRUQsa0RBcUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQ29tbW9uLUlucHV0c1xuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IHsgU2lnSWR4IH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxuaW1wb3J0IHtcbiAgU2VyaWFsaXphYmxlLFxuICBTZXJpYWxpemF0aW9uLFxuICBTZXJpYWxpemVkRW5jb2Rpbmdcbn0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2VJbnB1dCB7XG4gIGdldFR5cGVJRCgpOiBudW1iZXJcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyk6IG9iamVjdFxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyk6IHZvaWRcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlcik6IG51bWJlclxuICB0b0J1ZmZlcigpOiBCdWZmZXJcblxuICBnZXRJbnB1dCgpOiBCYXNlSW5wdXRcbiAgZ2V0SW5wdXRJRCgpOiBudW1iZXJcbiAgZ2V0Q3JlZGVudGlhbElEKCk6IG51bWJlclxuICBhZGRTaWduYXR1cmVJZHgoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpOiB2b2lkXG4gIGdldFNpZ0lkeHMoKTogU2lnSWR4W11cbiAgc2V0U2lnSWR4cyhzaWdJZHhzOiBTaWdJZHhbXSlcblxuICBjbG9uZSgpOiB0aGlzXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXNcbn1cblxuZXhwb3J0IGNvbnN0IEJhc2VJbnB1dENvbXBhcmF0b3IgPVxuICAoKTogKChhOiBCYXNlSW5wdXQsIGI6IEJhc2VJbnB1dCkgPT4gMSB8IC0xIHwgMCkgPT5cbiAgKGE6IEJhc2VJbnB1dCwgYjogQmFzZUlucHV0KTogMSB8IC0xIHwgMCA9PiB7XG4gICAgY29uc3QgYW91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBhb3V0aWQud3JpdGVVSW50MzJCRShhLmdldElucHV0SUQoKSwgMClcbiAgICBjb25zdCBhYnVmZjogQnVmZmVyID0gYS50b0J1ZmZlcigpXG5cbiAgICBjb25zdCBib3V0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGJvdXRpZC53cml0ZVVJbnQzMkJFKGIuZ2V0SW5wdXRJRCgpLCAwKVxuICAgIGNvbnN0IGJidWZmOiBCdWZmZXIgPSBiLnRvQnVmZmVyKClcblxuICAgIGNvbnN0IGFzb3J0OiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFxuICAgICAgW2FvdXRpZCwgYWJ1ZmZdLFxuICAgICAgYW91dGlkLmxlbmd0aCArIGFidWZmLmxlbmd0aFxuICAgIClcbiAgICBjb25zdCBic29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcbiAgICAgIFtib3V0aWQsIGJidWZmXSxcbiAgICAgIGJvdXRpZC5sZW5ndGggKyBiYnVmZi5sZW5ndGhcbiAgICApXG4gICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGFzb3J0LCBic29ydCkgYXMgMSB8IC0xIHwgMFxuICB9XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbnB1dCBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIklucHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgc2lnSWR4czogdGhpcy5zaWdJZHhzLm1hcCgocykgPT4gcy5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuc2lnSWR4cyA9IGZpZWxkc1tcInNpZ0lkeHNcIl0ubWFwKChzOiBvYmplY3QpID0+IHtcbiAgICAgIGxldCBzaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICAgIHNpZHguZGVzZXJpYWxpemUocywgZW5jb2RpbmcpXG4gICAgICByZXR1cm4gc2lkeFxuICAgIH0pXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICBwcm90ZWN0ZWQgc2lnQ291bnQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgc2lnSWR4czogU2lnSWR4W10gPSBbXSAvLyBpZHhzIG9mIHNpZ25lcnMgZnJvbSB1dHhvXG5cbiAgZ2V0SW5wdXQoKTogQmFzZUlucHV0IHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgYWJzdHJhY3QgZ2V0SW5wdXRJRCgpOiBudW1iZXJcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW0lucHV0XV1cbiAgICovXG4gIGdldFNpZ0lkeHMgPSAoKTogU2lnSWR4W10gPT4gdGhpcy5zaWdJZHhzXG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFycmF5IG9mIFtbU2lnSWR4XV0gZm9yIHRoaXMgW1tJbnB1dF1dXG4gICAqIE5vcm1hbHkgb25seSBjYWxsZWQgZm9yIE11bHRpc2lnIHJlcGxhY2VtZW50XG4gICAqL1xuICBzZXRTaWdJZHhzID0gKHNpZ0lkeHM6IFNpZ0lkeFtdKSA9PiB7XG4gICAgdGhpcy5zaWdJZHhzID0gc2lnSWR4c1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxuICB9XG5cbiAgYWJzdHJhY3QgZ2V0Q3JlZGVudGlhbElEKCk6IG51bWJlclxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBhZGRzIGEgW1tTaWdJZHhdXSB0byB0aGUgW1tJbnB1dF1dLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc0lkeCBUaGUgaW5kZXggb2YgdGhlIGFkZHJlc3MgdG8gcmVmZXJlbmNlIGluIHRoZSBzaWduYXR1cmVzXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBzb3VyY2Ugb2YgdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgYWRkU2lnbmF0dXJlSWR4ID0gKGFkZHJlc3NJZHg6IG51bWJlciwgYWRkcmVzczogQnVmZmVyKSA9PiB7XG4gICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBiLndyaXRlVUludDMyQkUoYWRkcmVzc0lkeCwgMClcbiAgICBzaWdpZHguZnJvbUJ1ZmZlcihiKVxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5zaWdDb3VudCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBzaWdDb3VudDogbnVtYmVyID0gdGhpcy5zaWdDb3VudC5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLnNpZ0lkeHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzaWdDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBzaWdpZHggPSBuZXcgU2lnSWR4KClcbiAgICAgIGNvbnN0IHNpZ2J1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICBzaWdpZHguZnJvbUJ1ZmZlcihzaWdidWZmKVxuICAgICAgb2Zmc2V0ICs9IDRcbiAgICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHRoaXMuc2lnQ291bnQubGVuZ3RoXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5zaWdDb3VudF1cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5zaWdJZHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0aGlzLnNpZ0lkeHNbYCR7aX1gXS50b0J1ZmZlcigpXG4gICAgICBiYXJyLnB1c2goYilcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0lucHV0XV0uXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXG5cbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xuXG4gIGFic3RyYWN0IHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IEJhc2VJbnB1dFxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRQYXJzZWFibGVJbnB1dCBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkUGFyc2VhYmxlSW5wdXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBpbnB1dDogdGhpcy5pbnB1dC5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGlucHV0OiBCYXNlSW5wdXRcblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1N0YW5kYXJkUGFyc2VhYmxlSW5wdXRdXXNcbiAgICovXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cbiAgICAoKTogKChcbiAgICAgIGE6IFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQsXG4gICAgICBiOiBTdGFuZGFyZFBhcnNlYWJsZUlucHV0XG4gICAgKSA9PiAxIHwgLTEgfCAwKSA9PlxuICAgIChhOiBTdGFuZGFyZFBhcnNlYWJsZUlucHV0LCBiOiBTdGFuZGFyZFBhcnNlYWJsZUlucHV0KTogMSB8IC0xIHwgMCA9PiB7XG4gICAgICBjb25zdCBzb3J0YSA9IGEudG9CdWZmZXIoKVxuICAgICAgY29uc3Qgc29ydGIgPSBiLnRvQnVmZmVyKClcbiAgICAgIHJldHVybiBCdWZmZXIuY29tcGFyZShzb3J0YSwgc29ydGIpIGFzIDEgfCAtMSB8IDBcbiAgICB9XG5cbiAgZ2V0SW5wdXQgPSAoKTogQmFzZUlucHV0ID0+IHRoaXMuaW5wdXRcblxuICBhZGRTaWduYXR1cmVJZHgoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpOiB2b2lkIHtcbiAgICB0aGlzLmlucHV0LmFkZFNpZ25hdHVyZUlkeChhZGRyZXNzSWR4LCBhZGRyZXNzKVxuICB9XG5cbiAgZ2V0U2lnSWR4cyA9ICgpOiBTaWdJZHhbXSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuZ2V0U2lnSWR4cygpXG4gIH1cblxuICBzZXRTaWdJZHhzID0gKHNpZ0lkeHM6IFNpZ0lkeFtdKSA9PiB0aGlzLmlucHV0LnNldFNpZ0lkeHMoc2lnSWR4cylcblxuICAvLyBtdXN0IGJlIGltcGxlbWVudGVkIHRvIHNlbGVjdCBpbnB1dCB0eXBlcyBmb3IgdGhlIFZNIGluIHF1ZXN0aW9uXG4gIGFic3RyYWN0IGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0PzogbnVtYmVyKTogbnVtYmVyXG5cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBpbmJ1ZmY6IEJ1ZmZlciA9IHRoaXMuaW5wdXQudG9CdWZmZXIoKVxuICAgIGNvbnN0IGluaWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGluaWQud3JpdGVVSW50MzJCRSh0aGlzLmlucHV0LmdldElucHV0SUQoKSwgMClcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtpbmlkLCBpbmJ1ZmZdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgaW5pZC5sZW5ndGggKyBpbmJ1ZmYubGVuZ3RoKVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiBbW1N0YW5kYXJkUGFyc2VhYmxlSW5wdXRdXSBmb3IgYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGlucHV0IEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgSW5wdXRJRCBvZiB0aGUgW1tTdGFuZGFyZFBhcnNlYWJsZUlucHV0XV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGlucHV0OiBCYXNlSW5wdXQgPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5pbnB1dCA9IGlucHV0XG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXQgZXh0ZW5kcyBTdGFuZGFyZFBhcnNlYWJsZUlucHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIHR4aWQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnR4aWQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIiksXG4gICAgICBvdXRwdXRpZHg6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5vdXRwdXRpZHgsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxuICAgICAgKSxcbiAgICAgIGFzc2V0SUQ6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLmFzc2V0SUQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIilcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnR4aWQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJ0eGlkXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImNiNThcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAzMlxuICAgIClcbiAgICB0aGlzLm91dHB1dGlkeCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcIm91dHB1dGlkeFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgNFxuICAgIClcbiAgICB0aGlzLmFzc2V0SUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJhc3NldElEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImNiNThcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAzMlxuICAgIClcbiAgICAvL2lucHV0IGRlc2VyaWFsaXphdGlvbiBtdXN0IGJlIGltcGxtZW50ZWQgaW4gY2hpbGQgY2xhc3Nlc1xuICB9XG5cbiAgcHJvdGVjdGVkIHR4aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIG91dHB1dGlkeDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBhc3NldElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgVHhJRC5cbiAgICovXG4gIGdldFR4SUQgPSAoKTogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gQnVmZmVyID0+IHRoaXMudHhpZFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gIG9mIHRoZSBPdXRwdXRJZHguXG4gICAqL1xuICBnZXRPdXRwdXRJZHggPSAoKTogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gQnVmZmVyID0+IHRoaXMub3V0cHV0aWR4XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgVVRYT0lEIHRoaXMgW1tTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0XV0gcmVmZXJlbmNlcy5cbiAgICovXG4gIGdldFVUWE9JRCA9ICgpOiBzdHJpbmcgPT5cbiAgICBiaW50b29scy5idWZmZXJUb0I1OChCdWZmZXIuY29uY2F0KFt0aGlzLnR4aWQsIHRoaXMub3V0cHV0aWR4XSkpXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlucHV0LlxuICAgKi9cbiAgZ2V0SW5wdXQgPSAoKTogQmFzZUlucHV0ID0+IHRoaXMuaW5wdXRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXNzZXRJRCBvZiB0aGUgaW5wdXQuXG4gICAqL1xuICBnZXRBc3NldElEID0gKCk6IEJ1ZmZlciA9PiB0aGlzLmFzc2V0SURcblxuICBhYnN0cmFjdCBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldD86IG51bWJlcik6IG51bWJlclxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBwYXJzZWFibGVCdWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9XG4gICAgICB0aGlzLnR4aWQubGVuZ3RoICtcbiAgICAgIHRoaXMub3V0cHV0aWR4Lmxlbmd0aCArXG4gICAgICB0aGlzLmFzc2V0SUQubGVuZ3RoICtcbiAgICAgIHBhcnNlYWJsZUJ1ZmYubGVuZ3RoXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXG4gICAgICB0aGlzLnR4aWQsXG4gICAgICB0aGlzLm91dHB1dGlkeCxcbiAgICAgIHRoaXMuYXNzZXRJRCxcbiAgICAgIHBhcnNlYWJsZUJ1ZmZcbiAgICBdXG4gICAgY29uc3QgYnVmZjogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgICByZXR1cm4gYnVmZlxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXSBmb3IgYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHR4aWQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcmVmZXJlbmNlZCBVVFhPXG4gICAqIEBwYXJhbSBvdXRwdXRpZHggQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIHRoZSBpbmRleCBvZiB0aGUgb3V0cHV0IGluIHRoZSB0cmFuc2FjdGlvbiBjb25zdW1lZCBpbiB0aGUgW1tTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0XV1cbiAgICogQHBhcmFtIGFzc2V0SUQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIGFzc2V0SUQgb2YgdGhlIFtbSW5wdXRdXVxuICAgKiBAcGFyYW0gaW5wdXQgQW4gW1tJbnB1dF1dIHRvIGJlIG1hZGUgdHJhbnNmZXJhYmxlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICB0eGlkOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0aWR4OiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGlucHV0OiBCYXNlSW5wdXQgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmIChcbiAgICAgIHR5cGVvZiB0eGlkICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIHR5cGVvZiBvdXRwdXRpZHggIT09IHVuZGVmaW5lZCAmJlxuICAgICAgdHlwZW9mIGFzc2V0SUQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgaW5wdXQgIT09IHVuZGVmaW5lZFxuICAgICkge1xuICAgICAgdGhpcy5pbnB1dCA9IGlucHV0XG4gICAgICB0aGlzLnR4aWQgPSB0eGlkXG4gICAgICB0aGlzLm91dHB1dGlkeCA9IG91dHB1dGlkeFxuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbSW5wdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSB0b2tlbiBhbW91bnQgLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRBbW91bnRJbnB1dCBleHRlbmRzIElucHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRBbW91bnRJbnB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGFtb3VudDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmFtb3VudCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgICA4XG4gICAgICApXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5hbW91bnQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJhbW91bnRcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDhcbiAgICApXG4gICAgdGhpcy5hbW91bnRWYWx1ZSA9IGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMuYW1vdW50KVxuICB9XG5cbiAgcHJvdGVjdGVkIGFtb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXG4gIHByb3RlY3RlZCBhbW91bnRWYWx1ZTogQk4gPSBuZXcgQk4oMClcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYW1vdW50IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqL1xuICBnZXRBbW91bnQgPSAoKTogQk4gPT4gdGhpcy5hbW91bnRWYWx1ZS5jbG9uZSgpXG5cbiAgLyoqXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBbW0Ftb3VudElucHV0XV0gYW5kIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIGlucHV0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMuYW1vdW50ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgOClcbiAgICB0aGlzLmFtb3VudFZhbHVlID0gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5hbW91bnQpXG4gICAgb2Zmc2V0ICs9IDhcbiAgICByZXR1cm4gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbQW1vdW50SW5wdXRdXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9IHRoaXMuYW1vdW50Lmxlbmd0aCArIHN1cGVyYnVmZi5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLmFtb3VudCwgc3VwZXJidWZmXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIEFuIFtbQW1vdW50SW5wdXRdXSBjbGFzcyB3aGljaCBpc3N1ZXMgYSBwYXltZW50IG9uIGFuIGFzc2V0SUQuXG4gICAqXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgaW5wdXRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFtb3VudDogQk4gPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKGFtb3VudCkge1xuICAgICAgdGhpcy5hbW91bnRWYWx1ZSA9IGFtb3VudC5jbG9uZSgpXG4gICAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGFtb3VudCwgOClcbiAgICB9XG4gIH1cbn1cbiJdfQ==