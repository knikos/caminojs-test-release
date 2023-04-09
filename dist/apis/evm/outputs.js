"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMOutput = exports.SECPTransferOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-EVM-Outputs
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputID A number representing the outputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
const SelectOutputClass = (outputID, ...args) => {
    if (outputID == constants_1.EVMConstants.SECPXFEROUTPUTID) {
        return new SECPTransferOutput(...args);
    }
    throw new errors_1.OutputIdError("Error - SelectOutputClass: unknown outputID");
};
exports.SelectOutputClass = SelectOutputClass;
class TransferableOutput extends output_1.StandardTransferableOutput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableOutput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, exports.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.EVMConstants.ASSETIDLEN);
        offset += constants_1.EVMConstants.ASSETIDLEN;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, exports.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.TransferableOutput = TransferableOutput;
class AmountOutput extends output_1.StandardAmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
}
exports.AmountOutput = AmountOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._typeID = constants_1.EVMConstants.SECPXFEROUTPUTID;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferOutput = SECPTransferOutput;
class EVMOutput {
    /**
     * An [[EVMOutput]] class which contains address, amount, and assetID.
     *
     * @param address The address recieving the asset as a {@link https://github.com/feross/buffer|Buffer} or a string.
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} or number representing the amount.
     * @param assetID The assetID which is being sent as a {@link https://github.com/feross/buffer|Buffer} or a string.
     */
    constructor(address = undefined, amount = undefined, assetID = undefined) {
        this.address = buffer_1.Buffer.alloc(20);
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        this.assetID = buffer_1.Buffer.alloc(32);
        /**
         * Returns the address of the input as {@link https://github.com/feross/buffer|Buffer}
         */
        this.getAddress = () => this.address;
        /**
         * Returns the address as a bech32 encoded string.
         */
        this.getAddressString = () => this.address.toString("hex");
        /**
         * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getAmount = () => this.amountValue.clone();
        /**
         * Returns the assetID of the input as {@link https://github.com/feross/buffer|Buffer}
         */
        this.getAssetID = () => this.assetID;
        if (typeof address !== "undefined" &&
            typeof amount !== "undefined" &&
            typeof assetID !== "undefined") {
            if (typeof address === "string") {
                // if present then remove `0x` prefix
                const prefix = address.substring(0, 2);
                if (prefix === "0x") {
                    address = address.split("x")[1];
                }
                address = buffer_1.Buffer.from(address, "hex");
            }
            // convert number amount to BN
            let amnt;
            if (typeof amount === "number") {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            // convert string assetID to Buffer
            if (!(assetID instanceof buffer_1.Buffer)) {
                assetID = bintools.cb58Decode(assetID);
            }
            this.address = address;
            this.amountValue = amnt.clone();
            this.amount = bintools.fromBNToBuffer(amnt, 8);
            this.assetID = assetID;
        }
    }
    serialize(encoding = "hex") {
        return {
            address: serializer.encoder(this.address, encoding, "Buffer", "hex"),
            amount: serializer.encoder(this.amount, encoding, "Buffer", "decimalString"),
            assetID: serializer.encoder(this.assetID, encoding, "Buffer", "cb58")
        };
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
     */
    toBuffer() {
        const bsize = this.address.length + this.amount.length + this.assetID.length;
        const barr = [this.address, this.amount, this.assetID];
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Decodes the [[EVMOutput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
     */
    fromBuffer(bytes, offset = 0) {
        this.address = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        return offset;
    }
    /**
     * Returns a base-58 representation of the [[EVMOutput]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    create(...args) {
        return new EVMOutput(...args);
    }
    clone() {
        const newEVMOutput = this.create();
        newEVMOutput.fromBuffer(this.toBuffer());
        return newEVMOutput;
    }
}
exports.EVMOutput = EVMOutput;
/**
 * Returns a function used to sort an array of [[EVMOutput]]s
 */
EVMOutput.comparator = () => (a, b) => {
    // primarily sort by address
    let sorta = a.getAddress();
    let sortb = b.getAddress();
    // secondarily sort by assetID
    if (sorta.equals(sortb)) {
        sorta = a.getAssetID();
        sortb = b.getAssetID();
    }
    return buffer_1.Buffer.compare(sorta, sortb);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2V2bS9vdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxrREFBc0I7QUFDdEIsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyxnREFJNEI7QUFDNUIsNkRBQTZFO0FBRTdFLCtDQUFrRDtBQUVsRCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sVUFBVSxHQUFHLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFOUM7Ozs7OztHQU1HO0FBQ0ksTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFFBQWdCLEVBQUUsR0FBRyxJQUFXLEVBQVUsRUFBRTtJQUM1RSxJQUFJLFFBQVEsSUFBSSx3QkFBWSxDQUFDLGdCQUFnQixFQUFFO1FBQzdDLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ3ZDO0lBQ0QsTUFBTSxJQUFJLHNCQUFhLENBQUMsNkNBQTZDLENBQUMsQ0FBQTtBQUN4RSxDQUFDLENBQUE7QUFMWSxRQUFBLGlCQUFpQixxQkFLN0I7QUFFRCxNQUFhLGtCQUFtQixTQUFRLG1DQUEwQjtJQUFsRTs7UUFDWSxjQUFTLEdBQUcsb0JBQW9CLENBQUE7UUFDaEMsWUFBTyxHQUFHLFNBQVMsQ0FBQTtJQXdCL0IsQ0FBQztJQXRCQyx3QkFBd0I7SUFFeEIsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUM1RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcs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QUUsS0FBSyxDQUFlLENBQUE7QUFDbkQsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUVWTS1PdXRwdXRzXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBFVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHtcbiAgT3V0cHV0LFxuICBTdGFuZGFyZEFtb3VudE91dHB1dCxcbiAgU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHsgRVZNSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgT3V0cHV0SWRFcnJvciB9IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBPdXRwdXQgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIG91dHB1dElEIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0SUQgcGFyc2VkIHByaW9yIHRvIHRoZSBieXRlcyBwYXNzZWQgaW5cbiAqXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW091dHB1dF1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0T3V0cHV0Q2xhc3MgPSAob3V0cHV0SUQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBPdXRwdXQgPT4ge1xuICBpZiAob3V0cHV0SUQgPT0gRVZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSUQpIHtcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCguLi5hcmdzKVxuICB9XG4gIHRocm93IG5ldyBPdXRwdXRJZEVycm9yKFwiRXJyb3IgLSBTZWxlY3RPdXRwdXRDbGFzczogdW5rbm93biBvdXRwdXRJRFwiKVxufVxuXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJhYmxlT3V0cHV0IGV4dGVuZHMgU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPdXRwdXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhmaWVsZHNbXCJvdXRwdXRcIl1bXCJfdHlwZUlEXCJdKVxuICAgIHRoaXMub3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm91dHB1dFwiXSwgZW5jb2RpbmcpXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oXG4gICAgICBieXRlcyxcbiAgICAgIG9mZnNldCxcbiAgICAgIG9mZnNldCArIEVWTUNvbnN0YW50cy5BU1NFVElETEVOXG4gICAgKVxuICAgIG9mZnNldCArPSBFVk1Db25zdGFudHMuQVNTRVRJRExFTlxuICAgIGNvbnN0IG91dHB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFtb3VudE91dHB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50T3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQW1vdW50T3V0cHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XG4gICAqL1xuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6IEJ1ZmZlcik6IFRyYW5zZmVyYWJsZU91dHB1dCB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcylcbiAgfVxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCB7XG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxuICB9XG59XG5cbi8qKlxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBhbW1vdW50IGZvciBhbiBhc3NldElEIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgU0VDUFRyYW5zZmVyT3V0cHV0IGV4dGVuZHMgQW1vdW50T3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUFRyYW5zZmVyT3V0cHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBFVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRFxuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3V0cHV0SUQgZm9yIHRoaXMgb3V0cHV0XG4gICAqL1xuICBnZXRPdXRwdXRJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld291dDogU0VDUFRyYW5zZmVyT3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVZNT3V0cHV0IHtcbiAgcHJvdGVjdGVkIGFkZHJlc3M6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyMClcbiAgcHJvdGVjdGVkIGFtb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXG4gIHByb3RlY3RlZCBhbW91bnRWYWx1ZTogQk4gPSBuZXcgQk4oMClcbiAgcHJvdGVjdGVkIGFzc2V0SUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIHJldHVybiB7XG4gICAgICBhZGRyZXNzOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5hZGRyZXNzLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJoZXhcIiksXG4gICAgICBhbW91bnQ6IHNlcmlhbGl6ZXIuZW5jb2RlcihcbiAgICAgICAgdGhpcy5hbW91bnQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxuICAgICAgKSxcbiAgICAgIGFzc2V0SUQ6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLmFzc2V0SUQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW0VWTU91dHB1dF1dc1xuICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPVxuICAgICgpOiAoKGE6IEVWTU91dHB1dCB8IEVWTUlucHV0LCBiOiBFVk1PdXRwdXQgfCBFVk1JbnB1dCkgPT4gMSB8IC0xIHwgMCkgPT5cbiAgICAoYTogRVZNT3V0cHV0IHwgRVZNSW5wdXQsIGI6IEVWTU91dHB1dCB8IEVWTUlucHV0KTogMSB8IC0xIHwgMCA9PiB7XG4gICAgICAvLyBwcmltYXJpbHkgc29ydCBieSBhZGRyZXNzXG4gICAgICBsZXQgc29ydGE6IEJ1ZmZlciA9IGEuZ2V0QWRkcmVzcygpXG4gICAgICBsZXQgc29ydGI6IEJ1ZmZlciA9IGIuZ2V0QWRkcmVzcygpXG4gICAgICAvLyBzZWNvbmRhcmlseSBzb3J0IGJ5IGFzc2V0SURcbiAgICAgIGlmIChzb3J0YS5lcXVhbHMoc29ydGIpKSB7XG4gICAgICAgIHNvcnRhID0gYS5nZXRBc3NldElEKClcbiAgICAgICAgc29ydGIgPSBiLmdldEFzc2V0SUQoKVxuICAgICAgfVxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHNvcnRhLCBzb3J0YikgYXMgMSB8IC0xIHwgMFxuICAgIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYWRkcmVzcyBvZiB0aGUgaW5wdXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICovXG4gIGdldEFkZHJlc3MgPSAoKTogQnVmZmVyID0+IHRoaXMuYWRkcmVzc1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIGFzIGEgYmVjaDMyIGVuY29kZWQgc3RyaW5nLlxuICAgKi9cbiAgZ2V0QWRkcmVzc1N0cmluZyA9ICgpOiBzdHJpbmcgPT4gdGhpcy5hZGRyZXNzLnRvU3RyaW5nKFwiaGV4XCIpXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFtb3VudCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKi9cbiAgZ2V0QW1vdW50ID0gKCk6IEJOID0+IHRoaXMuYW1vdW50VmFsdWUuY2xvbmUoKVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhc3NldElEIG9mIHRoZSBpbnB1dCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKi9cbiAgZ2V0QXNzZXRJRCA9ICgpOiBCdWZmZXIgPT4gdGhpcy5hc3NldElEXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFVk1PdXRwdXRdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9XG4gICAgICB0aGlzLmFkZHJlc3MubGVuZ3RoICsgdGhpcy5hbW91bnQubGVuZ3RoICsgdGhpcy5hc3NldElELmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuYWRkcmVzcywgdGhpcy5hbW91bnQsIHRoaXMuYXNzZXRJRF1cbiAgICBjb25zdCBidWZmOiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICAgIHJldHVybiBidWZmXG4gIH1cblxuICAvKipcbiAgICogRGVjb2RlcyB0aGUgW1tFVk1PdXRwdXRdXSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIHRoZSBzaXplLlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMuYWRkcmVzcyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIwKVxuICAgIG9mZnNldCArPSAyMFxuICAgIHRoaXMuYW1vdW50ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgOClcbiAgICBvZmZzZXQgKz0gOFxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgIG9mZnNldCArPSAzMlxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFVk1PdXRwdXRdXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgRVZNT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld0VWTU91dHB1dDogRVZNT3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld0VWTU91dHB1dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3RVZNT3V0cHV0IGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW0VWTU91dHB1dF1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFkZHJlc3MsIGFtb3VudCwgYW5kIGFzc2V0SUQuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHJlY2lldmluZyB0aGUgYXNzZXQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhIHN0cmluZy5cbiAgICogQHBhcmFtIGFtb3VudCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IG9yIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGFtb3VudC5cbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0SUQgd2hpY2ggaXMgYmVpbmcgc2VudCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgc3RyaW5nLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYWRkcmVzczogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGFtb3VudDogQk4gfCBudW1iZXIgPSB1bmRlZmluZWQsXG4gICAgYXNzZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkXG4gICkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBhZGRyZXNzICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgYW1vdW50ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgYXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIC8vIGlmIHByZXNlbnQgdGhlbiByZW1vdmUgYDB4YCBwcmVmaXhcbiAgICAgICAgY29uc3QgcHJlZml4OiBzdHJpbmcgPSBhZGRyZXNzLnN1YnN0cmluZygwLCAyKVxuICAgICAgICBpZiAocHJlZml4ID09PSBcIjB4XCIpIHtcbiAgICAgICAgICBhZGRyZXNzID0gYWRkcmVzcy5zcGxpdChcInhcIilbMV1cbiAgICAgICAgfVxuICAgICAgICBhZGRyZXNzID0gQnVmZmVyLmZyb20oYWRkcmVzcywgXCJoZXhcIilcbiAgICAgIH1cblxuICAgICAgLy8gY29udmVydCBudW1iZXIgYW1vdW50IHRvIEJOXG4gICAgICBsZXQgYW1udDogQk5cbiAgICAgIGlmICh0eXBlb2YgYW1vdW50ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIGFtbnQgPSBuZXcgQk4oYW1vdW50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYW1udCA9IGFtb3VudFxuICAgICAgfVxuXG4gICAgICAvLyBjb252ZXJ0IHN0cmluZyBhc3NldElEIHRvIEJ1ZmZlclxuICAgICAgaWYgKCEoYXNzZXRJRCBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgICAgYXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRClcbiAgICAgIH1cblxuICAgICAgdGhpcy5hZGRyZXNzID0gYWRkcmVzc1xuICAgICAgdGhpcy5hbW91bnRWYWx1ZSA9IGFtbnQuY2xvbmUoKVxuICAgICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihhbW50LCA4KVxuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxuICAgIH1cbiAgfVxufVxuIl19