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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2lucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFDeEMsa0RBQXNCO0FBQ3RCLCtDQUFzQztBQUN0QywwREFJK0I7QUFFL0I7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBb0J6RCxNQUFNLG1CQUFtQixHQUM5QixHQUFpRCxFQUFFLENBQ25ELENBQUMsQ0FBWSxFQUFFLENBQVksRUFBYyxFQUFFO0lBQ3pDLE1BQU0sTUFBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDdkMsTUFBTSxLQUFLLEdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBRWxDLE1BQU0sTUFBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDdkMsTUFBTSxLQUFLLEdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBRWxDLE1BQU0sS0FBSyxHQUFXLGVBQU0sQ0FBQyxNQUFNLENBQ2pDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FDN0IsQ0FBQTtJQUNELE1BQU0sS0FBSyxHQUFXLGVBQU0sQ0FBQyxNQUFNLENBQ2pDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUNmLE1B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LFdBQVcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0lBVUQ7O09BRUc7SUFDSCxVQUFVLENBQUMsS0FBYSxFQUFFLFNBQWlCLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzFELElBQUksQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdkQsTUFBTSxJQUFJLENBQUMsQ0FBQTtRQUNYLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE1BQU0sU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUMxQyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO1FBQzNELE1BQU0sSUFBSSxHQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUMvQyxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7Q0FjRjtBQXJFRCxrREFxRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBDb21tb24tSW5wdXRzXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBTaWdJZHggfSBmcm9tIFwiLi9jcmVkZW50aWFsc1wiXG5pbXBvcnQge1xuICBTZXJpYWxpemFibGUsXG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xufSBmcm9tIFwiLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZUlucHV0IHtcbiAgZ2V0VHlwZUlEKCk6IG51bWJlclxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nKTogb2JqZWN0XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nKTogdm9pZFxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyKTogbnVtYmVyXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlclxuXG4gIGdldElucHV0KCk6IEJhc2VJbnB1dFxuICBnZXRJbnB1dElEKCk6IG51bWJlclxuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyXG4gIGFkZFNpZ25hdHVyZUlkeChhZGRyZXNzSWR4OiBudW1iZXIsIGFkZHJlc3M6IEJ1ZmZlcik6IHZvaWRcbiAgZ2V0U2lnSWR4cygpOiBTaWdJZHhbXVxuXG4gIGNsb25lKCk6IHRoaXNcbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xufVxuXG5leHBvcnQgY29uc3QgQmFzZUlucHV0Q29tcGFyYXRvciA9XG4gICgpOiAoKGE6IEJhc2VJbnB1dCwgYjogQmFzZUlucHV0KSA9PiAxIHwgLTEgfCAwKSA9PlxuICAoYTogQmFzZUlucHV0LCBiOiBCYXNlSW5wdXQpOiAxIHwgLTEgfCAwID0+IHtcbiAgICBjb25zdCBhb3V0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGFvdXRpZC53cml0ZVVJbnQzMkJFKGEuZ2V0SW5wdXRJRCgpLCAwKVxuICAgIGNvbnN0IGFidWZmOiBCdWZmZXIgPSBhLnRvQnVmZmVyKClcblxuICAgIGNvbnN0IGJvdXRpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgYm91dGlkLndyaXRlVUludDMyQkUoYi5nZXRJbnB1dElEKCksIDApXG4gICAgY29uc3QgYmJ1ZmY6IEJ1ZmZlciA9IGIudG9CdWZmZXIoKVxuXG4gICAgY29uc3QgYXNvcnQ6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoXG4gICAgICBbYW91dGlkLCBhYnVmZl0sXG4gICAgICBhb3V0aWQubGVuZ3RoICsgYWJ1ZmYubGVuZ3RoXG4gICAgKVxuICAgIGNvbnN0IGJzb3J0OiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFxuICAgICAgW2JvdXRpZCwgYmJ1ZmZdLFxuICAgICAgYm91dGlkLmxlbmd0aCArIGJidWZmLmxlbmd0aFxuICAgIClcbiAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoYXNvcnQsIGJzb3J0KSBhcyAxIHwgLTEgfCAwXG4gIH1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIElucHV0IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiSW5wdXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzaWdJZHhzOiB0aGlzLnNpZ0lkeHMubWFwKChzKSA9PiBzLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5zaWdJZHhzID0gZmllbGRzW1wic2lnSWR4c1wiXS5tYXAoKHM6IG9iamVjdCkgPT4ge1xuICAgICAgbGV0IHNpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgICAgc2lkeC5kZXNlcmlhbGl6ZShzLCBlbmNvZGluZylcbiAgICAgIHJldHVybiBzaWR4XG4gICAgfSlcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIHByb3RlY3RlZCBzaWdDb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBzaWdJZHhzOiBTaWdJZHhbXSA9IFtdIC8vIGlkeHMgb2Ygc2lnbmVycyBmcm9tIHV0eG9cblxuICBnZXRJbnB1dCgpOiBCYXNlSW5wdXQge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBhYnN0cmFjdCBnZXRJbnB1dElEKCk6IG51bWJlclxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbSW5wdXRdXVxuICAgKi9cbiAgZ2V0U2lnSWR4cyA9ICgpOiBTaWdJZHhbXSA9PiB0aGlzLnNpZ0lkeHNcblxuICBhYnN0cmFjdCBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW0lucHV0XV0uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIHNvdXJjZSBvZiB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhZGRTaWduYXR1cmVJZHggPSAoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpID0+IHtcbiAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxuICAgIHNpZ2lkeC5mcm9tQnVmZmVyKGIpXG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKVxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLnNpZ0NvdW50ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IHNpZ0NvdW50OiBudW1iZXIgPSB0aGlzLnNpZ0NvdW50LnJlYWRVSW50MzJCRSgwKVxuICAgIHRoaXMuc2lnSWR4cyA9IFtdXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNpZ0NvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHNpZ2lkeCA9IG5ldyBTaWdJZHgoKVxuICAgICAgY29uc3Qgc2lnYnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIHNpZ2lkeC5mcm9tQnVmZmVyKHNpZ2J1ZmYpXG4gICAgICBvZmZzZXQgKz0gNFxuICAgICAgdGhpcy5zaWdJZHhzLnB1c2goc2lnaWR4KVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdGhpcy5zaWdDb3VudC5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLnNpZ0NvdW50XVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLnNpZ0lkeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMuc2lnSWR4c1tgJHtpfWBdLnRvQnVmZmVyKClcbiAgICAgIGJhcnIucHVzaChiKVxuICAgICAgYnNpemUgKz0gYi5sZW5ndGhcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbSW5wdXRdXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcbiAgfVxuXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcblxuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXG5cbiAgYWJzdHJhY3Qgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogQmFzZUlucHV0XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFBhcnNlYWJsZUlucHV0IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRQYXJzZWFibGVJbnB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGlucHV0OiB0aGlzLmlucHV0LnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgaW5wdXQ6IEJhc2VJbnB1dFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdXNlZCB0byBzb3J0IGFuIGFycmF5IG9mIFtbU3RhbmRhcmRQYXJzZWFibGVJbnB1dF1dc1xuICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPVxuICAgICgpOiAoKFxuICAgICAgYTogU3RhbmRhcmRQYXJzZWFibGVJbnB1dCxcbiAgICAgIGI6IFN0YW5kYXJkUGFyc2VhYmxlSW5wdXRcbiAgICApID0+IDEgfCAtMSB8IDApID0+XG4gICAgKGE6IFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQsIGI6IFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQpOiAxIHwgLTEgfCAwID0+IHtcbiAgICAgIGNvbnN0IHNvcnRhID0gYS50b0J1ZmZlcigpXG4gICAgICBjb25zdCBzb3J0YiA9IGIudG9CdWZmZXIoKVxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHNvcnRhLCBzb3J0YikgYXMgMSB8IC0xIHwgMFxuICAgIH1cblxuICBnZXRJbnB1dCA9ICgpOiBCYXNlSW5wdXQgPT4gdGhpcy5pbnB1dFxuXG4gIGFkZFNpZ25hdHVyZUlkeChhZGRyZXNzSWR4OiBudW1iZXIsIGFkZHJlc3M6IEJ1ZmZlcik6IHZvaWQge1xuICAgIHRoaXMuaW5wdXQuYWRkU2lnbmF0dXJlSWR4KGFkZHJlc3NJZHgsIGFkZHJlc3MpXG4gIH1cblxuICBnZXRTaWdJZHhzID0gKCk6IFNpZ0lkeFtdID0+IHtcbiAgICByZXR1cm4gdGhpcy5pbnB1dC5nZXRTaWdJZHhzKClcbiAgfVxuXG4gIC8vIG11c3QgYmUgaW1wbGVtZW50ZWQgdG8gc2VsZWN0IGlucHV0IHR5cGVzIGZvciB0aGUgVk0gaW4gcXVlc3Rpb25cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IGluYnVmZjogQnVmZmVyID0gdGhpcy5pbnB1dC50b0J1ZmZlcigpXG4gICAgY29uc3QgaW5pZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgaW5pZC53cml0ZVVJbnQzMkJFKHRoaXMuaW5wdXQuZ2V0SW5wdXRJRCgpLCAwKVxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW2luaWQsIGluYnVmZl1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBpbmlkLmxlbmd0aCArIGluYnVmZi5sZW5ndGgpXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIFtbU3RhbmRhcmRQYXJzZWFibGVJbnB1dF1dIGZvciBhIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaW5wdXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBJbnB1dElEIG9mIHRoZSBbW1N0YW5kYXJkUGFyc2VhYmxlSW5wdXRdXVxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5wdXQ6IEJhc2VJbnB1dCA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCBleHRlbmRzIFN0YW5kYXJkUGFyc2VhYmxlSW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgdHhpZDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMudHhpZCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcbiAgICAgIG91dHB1dGlkeDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLm91dHB1dGlkeCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXG4gICAgICApLFxuICAgICAgYXNzZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMudHhpZCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcInR4aWRcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiY2I1OFwiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDMyXG4gICAgKVxuICAgIHRoaXMub3V0cHV0aWR4ID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wib3V0cHV0aWR4XCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA0XG4gICAgKVxuICAgIHRoaXMuYXNzZXRJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImFzc2V0SURcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiY2I1OFwiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDMyXG4gICAgKVxuICAgIC8vaW5wdXQgZGVzZXJpYWxpemF0aW9uIG11c3QgYmUgaW1wbG1lbnRlZCBpbiBjaGlsZCBjbGFzc2VzXG4gIH1cblxuICBwcm90ZWN0ZWQgdHhpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICBwcm90ZWN0ZWQgb3V0cHV0aWR4OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIGFzc2V0SUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBUeElELlxuICAgKi9cbiAgZ2V0VHhJRCA9ICgpOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBCdWZmZXIgPT4gdGhpcy50eGlkXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSAgb2YgdGhlIE91dHB1dElkeC5cbiAgICovXG4gIGdldE91dHB1dElkeCA9ICgpOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBCdWZmZXIgPT4gdGhpcy5vdXRwdXRpZHhcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBVVFhPSUQgdGhpcyBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXSByZWZlcmVuY2VzLlxuICAgKi9cbiAgZ2V0VVRYT0lEID0gKCk6IHN0cmluZyA9PlxuICAgIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KEJ1ZmZlci5jb25jYXQoW3RoaXMudHhpZCwgdGhpcy5vdXRwdXRpZHhdKSlcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5wdXQuXG4gICAqL1xuICBnZXRJbnB1dCA9ICgpOiBCYXNlSW5wdXQgPT4gdGhpcy5pbnB1dFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhc3NldElEIG9mIHRoZSBpbnB1dC5cbiAgICovXG4gIGdldEFzc2V0SUQgPSAoKTogQnVmZmVyID0+IHRoaXMuYXNzZXRJRFxuXG4gIGFic3RyYWN0IGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0PzogbnVtYmVyKTogbnVtYmVyXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0XV0uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHBhcnNlYWJsZUJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHRoaXMudHhpZC5sZW5ndGggK1xuICAgICAgdGhpcy5vdXRwdXRpZHgubGVuZ3RoICtcbiAgICAgIHRoaXMuYXNzZXRJRC5sZW5ndGggK1xuICAgICAgcGFyc2VhYmxlQnVmZi5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtcbiAgICAgIHRoaXMudHhpZCxcbiAgICAgIHRoaXMub3V0cHV0aWR4LFxuICAgICAgdGhpcy5hc3NldElELFxuICAgICAgcGFyc2VhYmxlQnVmZlxuICAgIF1cbiAgICBjb25zdCBidWZmOiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICAgIHJldHVybiBidWZmXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dF1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIFtbU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dF1dIGZvciBhIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdHhpZCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSByZWZlcmVuY2VkIFVUWE9cbiAgICogQHBhcmFtIG91dHB1dGlkeCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIGluZGV4IG9mIHRoZSBvdXRwdXQgaW4gdGhlIHRyYW5zYWN0aW9uIGNvbnN1bWVkIGluIHRoZSBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlSW5wdXRdXVxuICAgKiBAcGFyYW0gYXNzZXRJRCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgYXNzZXRJRCBvZiB0aGUgW1tJbnB1dF1dXG4gICAqIEBwYXJhbSBpbnB1dCBBbiBbW0lucHV0XV0gdG8gYmUgbWFkZSB0cmFuc2ZlcmFibGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHR4aWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRpZHg6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgaW5wdXQ6IEJhc2VJbnB1dCA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIHR4aWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgdHlwZW9mIG91dHB1dGlkeCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICB0eXBlb2YgYXNzZXRJRCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBpbnB1dCAhPT0gdW5kZWZpbmVkXG4gICAgKSB7XG4gICAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgICAgIHRoaXMudHhpZCA9IHR4aWRcbiAgICAgIHRoaXMub3V0cHV0aWR4ID0gb3V0cHV0aWR4XG4gICAgICB0aGlzLmFzc2V0SUQgPSBhc3NldElEXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQW4gW1tJbnB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhIHRva2VuIGFtb3VudCAuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZEFtb3VudElucHV0IGV4dGVuZHMgSW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZEFtb3VudElucHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgYW1vdW50OiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuYW1vdW50LFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJCdWZmZXJcIixcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICAgIDhcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmFtb3VudCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImFtb3VudFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgOFxuICAgIClcbiAgICB0aGlzLmFtb3VudFZhbHVlID0gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5hbW91bnQpXG4gIH1cblxuICBwcm90ZWN0ZWQgYW1vdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoOClcbiAgcHJvdGVjdGVkIGFtb3VudFZhbHVlOiBCTiA9IG5ldyBCTigwKVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhbW91bnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICovXG4gIGdldEFtb3VudCA9ICgpOiBCTiA9PiB0aGlzLmFtb3VudFZhbHVlLmNsb25lKClcblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbQW1vdW50SW5wdXRdXSBhbmQgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgaW5wdXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgIHRoaXMuYW1vdW50VmFsdWUgPSBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLmFtb3VudClcbiAgICBvZmZzZXQgKz0gOFxuICAgIHJldHVybiBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tBbW91bnRJbnB1dF1dIGluc3RhbmNlLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID0gdGhpcy5hbW91bnQubGVuZ3RoICsgc3VwZXJidWZmLmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuYW1vdW50LCBzdXBlcmJ1ZmZdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICAvKipcbiAgICogQW4gW1tBbW91bnRJbnB1dF1dIGNsYXNzIHdoaWNoIGlzc3VlcyBhIHBheW1lbnQgb24gYW4gYXNzZXRJRC5cbiAgICpcbiAgICogQHBhcmFtIGFtb3VudCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgYW1vdW50IGluIHRoZSBpbnB1dFxuICAgKi9cbiAgY29uc3RydWN0b3IoYW1vdW50OiBCTiA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICBpZiAoYW1vdW50KSB7XG4gICAgICB0aGlzLmFtb3VudFZhbHVlID0gYW1vdW50LmNsb25lKClcbiAgICAgIHRoaXMuYW1vdW50ID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIoYW1vdW50LCA4KVxuICAgIH1cbiAgfVxufVxuIl19