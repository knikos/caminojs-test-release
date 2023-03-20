"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMInput = exports.SECPTransferInput = exports.AmountInput = exports.TransferableInput = exports.SelectInputClass = void 0;
/**
 * @packageDocumentation
 * @module API-EVM-Inputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const input_1 = require("../../common/input");
const outputs_1 = require("./outputs");
const bn_js_1 = __importDefault(require("bn.js"));
const credentials_1 = require("../../common/credentials");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputID A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
const SelectInputClass = (inputID, ...args) => {
    if (inputID === constants_1.EVMConstants.SECPINPUTID) {
        return new SECPTransferInput(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InputIdError("Error - SelectInputClass: unknown inputID");
};
exports.SelectInputClass = SelectInputClass;
class TransferableInput extends input_1.StandardTransferableInput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableInput";
        this._typeID = undefined;
        /**
         *
         * Assesses the amount to be paid based on the number of signatures required
         * @returns the amount to be paid
         */
        this.getCost = (c) => {
            const numSigs = this.getInput().getSigIdxs().length;
            return numSigs * c.costPerSignature;
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.input = (0, exports.SelectInputClass)(fields["input"]["_typeID"]);
        this.input.deserialize(fields["input"], encoding);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[TransferableInput]], parses it, populates the class, and returns the length of the [[TransferableInput]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransferableInput]]
     *
     * @returns The length of the raw [[TransferableInput]]
     */
    fromBuffer(bytes, offset = 0) {
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.EVMConstants.ASSETIDLEN);
        offset += 32;
        const inputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.input = (0, exports.SelectInputClass)(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
}
exports.TransferableInput = TransferableInput;
class AmountInput extends input_1.StandardAmountInput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountInput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    select(id, ...args) {
        return (0, exports.SelectInputClass)(id, ...args);
    }
}
exports.AmountInput = AmountInput;
class SECPTransferInput extends AmountInput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferInput";
        this._typeID = constants_1.EVMConstants.SECPINPUTID;
        this.getCredentialID = () => constants_1.EVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return constants_1.EVMConstants.SECPINPUTID;
    }
    create(...args) {
        return new SECPTransferInput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferInput = SECPTransferInput;
class EVMInput extends outputs_1.EVMOutput {
    /**
     * An [[EVMInput]] class which contains address, amount, assetID, nonce.
     *
     * @param address is the EVM address from which to transfer funds.
     * @param amount is the amount of the asset to be transferred (specified in nAVAX for AVAX and the smallest denomination for all other assets).
     * @param assetID The assetID which is being sent as a {@link https://github.com/feross/buffer|Buffer} or as a string.
     * @param nonce A {@link https://github.com/indutny/bn.js/|BN} or a number representing the nonce.
     */
    constructor(address = undefined, amount = undefined, assetID = undefined, nonce = undefined) {
        super(address, amount, assetID);
        this.nonce = buffer_1.Buffer.alloc(8);
        this.nonceValue = new bn_js_1.default(0);
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
        /**
         * Returns the nonce as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getNonce = () => this.nonceValue.clone();
        this.getCredentialID = () => constants_1.EVMConstants.SECPCREDENTIAL;
        if (typeof nonce !== "undefined") {
            // convert number nonce to BN
            let n;
            if (typeof nonce === "number") {
                n = new bn_js_1.default(nonce);
            }
            else {
                n = nonce;
            }
            this.nonceValue = n.clone();
            this.nonce = bintools.fromBNToBuffer(n, 8);
        }
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let bsize = superbuff.length + this.nonce.length;
        let barr = [superbuff, this.nonce];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Decodes the [[EVMInput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
     *
     * @param bytes The bytes as a {@link https://github.com/feross/buffer|Buffer}.
     * @param offset An offset as a number.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.nonce = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }
    /**
     * Returns a base-58 representation of the [[EVMInput]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    create(...args) {
        return new EVMInput(...args);
    }
    clone() {
        const newEVMInput = this.create();
        newEVMInput.fromBuffer(this.toBuffer());
        return newEVMInput;
    }
}
exports.EVMInput = EVMInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvZXZtL2lucHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyw4Q0FJMkI7QUFFM0IsdUNBQXFDO0FBQ3JDLGtEQUFzQjtBQUN0QiwwREFBaUQ7QUFDakQsK0NBQWlEO0FBR2pEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVqRDs7Ozs7O0dBTUc7QUFDSSxNQUFNLGdCQUFnQixHQUFHLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVyxFQUFTLEVBQUU7SUFDekUsSUFBSSxPQUFPLEtBQUssd0JBQVksQ0FBQyxXQUFXLEVBQUU7UUFDeEMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDdEM7SUFDRCwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQUMsMkNBQTJDLENBQUMsQ0FBQTtBQUNyRSxDQUFDLENBQUE7QUFOWSxRQUFBLGdCQUFnQixvQkFNNUI7QUFFRCxNQUFhLGlCQUFrQixTQUFRLGlDQUF5QjtJQUFoRTs7UUFDWSxjQUFTLEdBQUcsbUJBQW1CLENBQUE7UUFDL0IsWUFBTyxHQUFHLFNBQVMsQ0FBQTtRQVU3Qjs7OztXQUlHO1FBQ0gsWUFBTyxHQUFHLENBQUMsQ0FBSSxFQUFVLEVBQUU7WUFDekIsTUFBTSxPQUFPLEdBQVcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQTtZQUMzRCxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUE7UUFDckMsQ0FBQyxDQUFBO0lBMkJILENBQUM7SUEzQ0Msd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxL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QixPQUFPLElBQUksUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDdEMsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLFdBQVcsR0FBYSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDM0MsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUN2QyxPQUFPLFdBQW1CLENBQUE7SUFDNUIsQ0FBQztDQStCRjtBQXZHRCw0QkF1R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktRVZNLUlucHV0c1xuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IEVWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQge1xuICBJbnB1dCxcbiAgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCxcbiAgU3RhbmRhcmRBbW91bnRJbnB1dFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2lucHV0XCJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IEVWTU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBTaWdJZHggfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcbmltcG9ydCB7IElucHV0SWRFcnJvciB9IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IHsgQyB9IGZyb20gXCIuLi8uLi91dGlscy9uZXR3b3Jrc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0lucHV0XV0gaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIGlucHV0SUQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBpbnB1dElEIHBhcnNlZCBwcmlvciB0byB0aGUgYnl0ZXMgcGFzc2VkIGluXG4gKlxuICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgYW4gW1tJbnB1dF1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0SW5wdXRDbGFzcyA9IChpbnB1dElEOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogSW5wdXQgPT4ge1xuICBpZiAoaW5wdXRJRCA9PT0gRVZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEKSB7XG4gICAgcmV0dXJuIG5ldyBTRUNQVHJhbnNmZXJJbnB1dCguLi5hcmdzKVxuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHRocm93IG5ldyBJbnB1dElkRXJyb3IoXCJFcnJvciAtIFNlbGVjdElucHV0Q2xhc3M6IHVua25vd24gaW5wdXRJRFwiKVxufVxuXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJhYmxlSW5wdXQgZXh0ZW5kcyBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlSW5wdXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5pbnB1dCA9IFNlbGVjdElucHV0Q2xhc3MoZmllbGRzW1wiaW5wdXRcIl1bXCJfdHlwZUlEXCJdKVxuICAgIHRoaXMuaW5wdXQuZGVzZXJpYWxpemUoZmllbGRzW1wiaW5wdXRcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEFzc2Vzc2VzIHRoZSBhbW91bnQgdG8gYmUgcGFpZCBiYXNlZCBvbiB0aGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWRcbiAgICogQHJldHVybnMgdGhlIGFtb3VudCB0byBiZSBwYWlkXG4gICAqL1xuICBnZXRDb3N0ID0gKGM6IEMpOiBudW1iZXIgPT4ge1xuICAgIGNvbnN0IG51bVNpZ3M6IG51bWJlciA9IHRoaXMuZ2V0SW5wdXQoKS5nZXRTaWdJZHhzKCkubGVuZ3RoXG4gICAgcmV0dXJuIG51bVNpZ3MgKiBjLmNvc3RQZXJTaWduYXR1cmVcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSBbW1RyYW5zZmVyYWJsZUlucHV0XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbVHJhbnNmZXJhYmxlSW5wdXRdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oXG4gICAgICBieXRlcyxcbiAgICAgIG9mZnNldCxcbiAgICAgIG9mZnNldCArIEVWTUNvbnN0YW50cy5BU1NFVElETEVOXG4gICAgKVxuICAgIG9mZnNldCArPSAzMlxuICAgIGNvbnN0IGlucHV0aWQ6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuaW5wdXQgPSBTZWxlY3RJbnB1dENsYXNzKGlucHV0aWQpXG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBbW91bnRJbnB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50SW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRJbnB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IElucHV0IHtcbiAgICByZXR1cm4gU2VsZWN0SW5wdXRDbGFzcyhpZCwgLi4uYXJncylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU0VDUFRyYW5zZmVySW5wdXQgZXh0ZW5kcyBBbW91bnRJbnB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BUcmFuc2ZlcklucHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBFVk1Db25zdGFudHMuU0VDUElOUFVUSURcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlucHV0SUQgZm9yIHRoaXMgaW5wdXRcbiAgICovXG4gIGdldElucHV0SUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gRVZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEXG4gIH1cblxuICBnZXRDcmVkZW50aWFsSUQgPSAoKTogbnVtYmVyID0+IEVWTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVySW5wdXQoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3b3V0OiBTRUNQVHJhbnNmZXJJbnB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVWTUlucHV0IGV4dGVuZHMgRVZNT3V0cHV0IHtcbiAgcHJvdGVjdGVkIG5vbmNlOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoOClcbiAgcHJvdGVjdGVkIG5vbmNlVmFsdWU6IEJOID0gbmV3IEJOKDApXG4gIHByb3RlY3RlZCBzaWdDb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBzaWdJZHhzOiBTaWdJZHhbXSA9IFtdIC8vIGlkeHMgb2Ygc2lnbmVycyBmcm9tIHV0eG9cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW0lucHV0XV1cbiAgICovXG4gIGdldFNpZ0lkeHMgPSAoKTogU2lnSWR4W10gPT4gdGhpcy5zaWdJZHhzXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW0lucHV0XV0uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIHNvdXJjZSBvZiB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhZGRTaWduYXR1cmVJZHggPSAoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpID0+IHtcbiAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxuICAgIHNpZ2lkeC5mcm9tQnVmZmVyKGIpXG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKVxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBub25jZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKi9cbiAgZ2V0Tm9uY2UgPSAoKTogQk4gPT4gdGhpcy5ub25jZVZhbHVlLmNsb25lKClcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0VWTU91dHB1dF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBsZXQgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoICsgdGhpcy5ub25jZS5sZW5ndGhcbiAgICBsZXQgYmFycjogQnVmZmVyW10gPSBbc3VwZXJidWZmLCB0aGlzLm5vbmNlXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgZ2V0Q3JlZGVudGlhbElEID0gKCk6IG51bWJlciA9PiBFVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxcblxuICAvKipcbiAgICogRGVjb2RlcyB0aGUgW1tFVk1JbnB1dF1dIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIHJldHVybnMgdGhlIHNpemUuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBUaGUgYnl0ZXMgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICogQHBhcmFtIG9mZnNldCBBbiBvZmZzZXQgYXMgYSBudW1iZXIuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMubm9uY2UgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgIG9mZnNldCArPSA4XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0VWTUlucHV0XV0uXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IEVWTUlucHV0KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld0VWTUlucHV0OiBFVk1JbnB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdFVk1JbnB1dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3RVZNSW5wdXQgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIFtbRVZNSW5wdXRdXSBjbGFzcyB3aGljaCBjb250YWlucyBhZGRyZXNzLCBhbW91bnQsIGFzc2V0SUQsIG5vbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBpcyB0aGUgRVZNIGFkZHJlc3MgZnJvbSB3aGljaCB0byB0cmFuc2ZlciBmdW5kcy5cbiAgICogQHBhcmFtIGFtb3VudCBpcyB0aGUgYW1vdW50IG9mIHRoZSBhc3NldCB0byBiZSB0cmFuc2ZlcnJlZCAoc3BlY2lmaWVkIGluIG5BVkFYIGZvciBBVkFYIGFuZCB0aGUgc21hbGxlc3QgZGVub21pbmF0aW9uIGZvciBhbGwgb3RoZXIgYXNzZXRzKS5cbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0SUQgd2hpY2ggaXMgYmVpbmcgc2VudCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFzIGEgc3RyaW5nLlxuICAgKiBAcGFyYW0gbm9uY2UgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBvciBhIG51bWJlciByZXByZXNlbnRpbmcgdGhlIG5vbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYWRkcmVzczogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGFtb3VudDogQk4gfCBudW1iZXIgPSB1bmRlZmluZWQsXG4gICAgYXNzZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIG5vbmNlOiBCTiB8IG51bWJlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihhZGRyZXNzLCBhbW91bnQsIGFzc2V0SUQpXG5cbiAgICBpZiAodHlwZW9mIG5vbmNlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvLyBjb252ZXJ0IG51bWJlciBub25jZSB0byBCTlxuICAgICAgbGV0IG46IEJOXG4gICAgICBpZiAodHlwZW9mIG5vbmNlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIG4gPSBuZXcgQk4obm9uY2UpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuID0gbm9uY2VcbiAgICAgIH1cblxuICAgICAgdGhpcy5ub25jZVZhbHVlID0gbi5jbG9uZSgpXG4gICAgICB0aGlzLm5vbmNlID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobiwgOClcbiAgICB9XG4gIH1cbn1cbiJdfQ==