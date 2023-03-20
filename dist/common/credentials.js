"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECPMultisigCredential = exports.Credential = exports.Signature = exports.SigIdx = void 0;
/**
 * @packageDocumentation
 * @module Common-Signature
 */
const nbytes_1 = require("./nbytes");
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
class SigIdx extends nbytes_1.NBytes {
    /**
     * Type representing a [[Signature]] index used in [[Input]]
     */
    constructor() {
        super();
        this._typeName = "SigIdx";
        this._typeID = undefined;
        this.source = buffer_1.Buffer.alloc(20);
        this.bytes = buffer_1.Buffer.alloc(4);
        this.bsize = 4;
        /**
         * Sets the source address for the signature
         */
        this.setSource = (address) => {
            this.source = address;
        };
        /**
         * Retrieves the source address for the signature
         */
        this.getSource = () => this.source;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { source: serialization.encoder(this.source, encoding, "Buffer", "hex") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.source = serialization.decoder(fields["source"], encoding, "hex", "Buffer");
    }
    clone() {
        let newbase = new SigIdx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create() {
        return new SigIdx();
    }
}
exports.SigIdx = SigIdx;
/**
 * Signature for a [[Tx]]
 */
class Signature extends nbytes_1.NBytes {
    /**
     * Signature for a [[Tx]]
     */
    constructor() {
        super();
        this._typeName = "Signature";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(65);
        this.bsize = 65;
    }
    clone() {
        let newbase = new Signature();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create() {
        return new Signature();
    }
}
exports.Signature = Signature;
class Credential extends serialization_1.Serializable {
    constructor(sigarray = undefined) {
        super();
        this._typeName = "Credential";
        this._typeID = undefined;
        this.sigArray = [];
        /**
         * Adds a signature to the credentials and returns the index off the added signature.
         */
        this.addSignature = (sig) => {
            this.sigArray.push(sig);
            return this.sigArray.length - 1;
        };
        if (typeof sigarray !== "undefined") {
            /* istanbul ignore next */
            this.sigArray = sigarray;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigArray: this.sigArray.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigArray = fields["sigArray"].map((s) => {
            let sig = new Signature();
            sig.deserialize(s, encoding);
            return sig;
        });
    }
    getCredentialID() {
        return this._typeID;
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setCodecID(codecID) { }
    fromBuffer(bytes, offset = 0) {
        const siglen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.sigArray = [];
        for (let i = 0; i < siglen; i++) {
            const sig = new Signature();
            offset = sig.fromBuffer(bytes, offset);
            this.sigArray.push(sig);
        }
        return offset;
    }
    toBuffer() {
        const siglen = buffer_1.Buffer.alloc(4);
        siglen.writeInt32BE(this.sigArray.length, 0);
        const barr = [siglen];
        let bsize = siglen.length;
        for (let i = 0; i < this.sigArray.length; i++) {
            const sigbuff = this.sigArray[`${i}`].toBuffer();
            bsize += sigbuff.length;
            barr.push(sigbuff);
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.Credential = Credential;
class SECPMultisigCredential extends Credential {
    constructor(typeID, sigIdxs, sigarray) {
        super(sigarray);
        this._typeName = "SECPMultisigCredential";
        this._typeID = undefined;
        this.sigIdxs = [];
        /**
         * Adds a SignatureIndex to the credentials.
         */
        this.addSSignatureIndex = (sigIdx) => {
            this.sigIdxs.push(sigIdx);
        };
        this._typeID = typeID;
        if (sigIdxs)
            this.sigIdxs = sigIdxs;
    }
    clone() {
        const newbase = new SECPMultisigCredential(this._typeID);
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new SECPMultisigCredential(args.length == 1 ? args[0] : this._typeID);
    }
    select(id, ...args) {
        if (id === this._typeID)
            return this.create(args);
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const sigIdxlen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.sigIdxs = [];
        for (let i = 0; i < sigIdxlen; i++) {
            const sigIdx = new SigIdx();
            offset = sigIdx.fromBuffer(bytes, offset);
            this.sigIdxs.push(sigIdx);
        }
        return offset;
    }
    toBuffer() {
        // The signatures
        const superBuff = super.toBuffer();
        const sigIdxlen = buffer_1.Buffer.alloc(4);
        sigIdxlen.writeInt32BE(this.sigIdxs.length, 0);
        const barr = [superBuff, sigIdxlen];
        let bsize = superBuff.length + sigIdxlen.length;
        for (const sigIdx of this.sigIdxs) {
            const sigIdxBuff = sigIdx.toBuffer();
            bsize += sigIdxBuff.length;
            barr.push(sigIdxBuff);
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SECPMultisigCredential = SECPMultisigCredential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILHFDQUFpQztBQUNqQyxvQ0FBZ0M7QUFDaEMsaUVBQXdDO0FBQ3hDLDBEQUkrQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNO0lBK0NoQzs7T0FFRztJQUNIO1FBQ0UsS0FBSyxFQUFFLENBQUE7UUFsREMsY0FBUyxHQUFHLFFBQVEsQ0FBQTtRQUNwQixZQUFPLEdBQUcsU0FBUyxDQUFBO1FBbUJuQixXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNqQyxVQUFLLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2QixVQUFLLEdBQUcsQ0FBQyxDQUFBO1FBRW5COztXQUVHO1FBQ0gsY0FBUyxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQUU7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUE7UUFDdkIsQ0FBQyxDQUFBO1FBRUQ7O1dBRUc7UUFDSCxjQUFTLEdBQUcsR0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQWlCckMsQ0FBQztJQWhERCxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxNQUFNLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVB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TyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM5QyxNQUFNLElBQUksR0FBYSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUM3QyxJQUFJLEtBQUssR0FBVyxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUE7UUFFdkQsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pDLE1BQU0sVUFBVSxHQUFXLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUM1QyxLQUFLLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQTtZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1NBQ3RCO1FBQ0QsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0NBT0Y7QUFsRUQsd0RBa0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQ29tbW9uLVNpZ25hdHVyZVxuICovXG5pbXBvcnQgeyBOQnl0ZXMgfSBmcm9tIFwiLi9uYnl0ZXNcIlxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQge1xuICBTZXJpYWxpemFibGUsXG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xufSBmcm9tIFwiLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogVHlwZSByZXByZXNlbnRpbmcgYSBbW1NpZ25hdHVyZV1dIGluZGV4IHVzZWQgaW4gW1tJbnB1dF1dXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWdJZHggZXh0ZW5kcyBOQnl0ZXMge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTaWdJZHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzb3VyY2U6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnNvdXJjZSwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiaGV4XCIpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5zb3VyY2UgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJzb3VyY2VcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiaGV4XCIsXG4gICAgICBcIkJ1ZmZlclwiXG4gICAgKVxuICB9XG5cbiAgcHJvdGVjdGVkIHNvdXJjZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIwKVxuICBwcm90ZWN0ZWQgYnl0ZXMgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIGJzaXplID0gNFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzb3VyY2UgYWRkcmVzcyBmb3IgdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgc2V0U291cmNlID0gKGFkZHJlc3M6IEJ1ZmZlcikgPT4ge1xuICAgIHRoaXMuc291cmNlID0gYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgc291cmNlIGFkZHJlc3MgZm9yIHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGdldFNvdXJjZSA9ICgpOiBCdWZmZXIgPT4gdGhpcy5zb3VyY2VcblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBsZXQgbmV3YmFzZTogU2lnSWR4ID0gbmV3IFNpZ0lkeCgpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBTaWdJZHgoKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogVHlwZSByZXByZXNlbnRpbmcgYSBbW1NpZ25hdHVyZV1dIGluZGV4IHVzZWQgaW4gW1tJbnB1dF1dXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gIH1cbn1cblxuLyoqXG4gKiBTaWduYXR1cmUgZm9yIGEgW1tUeF1dXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduYXR1cmUgZXh0ZW5kcyBOQnl0ZXMge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTaWduYXR1cmVcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICBwcm90ZWN0ZWQgYnl0ZXMgPSBCdWZmZXIuYWxsb2MoNjUpXG4gIHByb3RlY3RlZCBic2l6ZSA9IDY1XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKCk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgU2lnbmF0dXJlKCkgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25hdHVyZSBmb3IgYSBbW1R4XV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ3JlZGVudGlhbCBleHRlbmRzIFNlcmlhbGl6YWJsZSB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkNyZWRlbnRpYWxcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzaWdBcnJheTogdGhpcy5zaWdBcnJheS5tYXAoKHMpID0+IHMuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnNpZ0FycmF5ID0gZmllbGRzW1wic2lnQXJyYXlcIl0ubWFwKChzOiBvYmplY3QpID0+IHtcbiAgICAgIGxldCBzaWc6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxuICAgICAgc2lnLmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKVxuICAgICAgcmV0dXJuIHNpZ1xuICAgIH0pXG4gIH1cblxuICBwcm90ZWN0ZWQgc2lnQXJyYXk6IFNpZ25hdHVyZVtdID0gW11cblxuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb2RlY0lEXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlY0lEIFRoZSBjb2RlY0lEIHRvIHNldFxuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge31cblxuICAvKipcbiAgICogQWRkcyBhIHNpZ25hdHVyZSB0byB0aGUgY3JlZGVudGlhbHMgYW5kIHJldHVybnMgdGhlIGluZGV4IG9mZiB0aGUgYWRkZWQgc2lnbmF0dXJlLlxuICAgKi9cbiAgYWRkU2lnbmF0dXJlID0gKHNpZzogU2lnbmF0dXJlKTogbnVtYmVyID0+IHtcbiAgICB0aGlzLnNpZ0FycmF5LnB1c2goc2lnKVxuICAgIHJldHVybiB0aGlzLnNpZ0FycmF5Lmxlbmd0aCAtIDFcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBzaWdsZW46IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuc2lnQXJyYXkgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzaWdsZW47IGkrKykge1xuICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgIG9mZnNldCA9IHNpZy5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLnNpZ0FycmF5LnB1c2goc2lnKVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHNpZ2xlbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgc2lnbGVuLndyaXRlSW50MzJCRSh0aGlzLnNpZ0FycmF5Lmxlbmd0aCwgMClcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzaWdsZW5dXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSBzaWdsZW4ubGVuZ3RoXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuc2lnQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNpZ2J1ZmY6IEJ1ZmZlciA9IHRoaXMuc2lnQXJyYXlbYCR7aX1gXS50b0J1ZmZlcigpXG4gICAgICBic2l6ZSArPSBzaWdidWZmLmxlbmd0aFxuICAgICAgYmFyci5wdXNoKHNpZ2J1ZmYpXG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgYWJzdHJhY3QgY2xvbmUoKTogdGhpc1xuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXG4gIGFic3RyYWN0IHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IENyZWRlbnRpYWxcbiAgY29uc3RydWN0b3Ioc2lnYXJyYXk6IFNpZ25hdHVyZVtdID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmICh0eXBlb2Ygc2lnYXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aGlzLnNpZ0FycmF5ID0gc2lnYXJyYXlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNFQ1BNdWx0aXNpZ0NyZWRlbnRpYWwgZXh0ZW5kcyBDcmVkZW50aWFsIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUE11bHRpc2lnQ3JlZGVudGlhbFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdID0gW11cblxuICAvKipcbiAgICogQWRkcyBhIFNpZ25hdHVyZUluZGV4IHRvIHRoZSBjcmVkZW50aWFscy5cbiAgICovXG4gIGFkZFNTaWduYXR1cmVJbmRleCA9IChzaWdJZHg6IFNpZ0lkeCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ0lkeClcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld2Jhc2UgPSBuZXcgU0VDUE11bHRpc2lnQ3JlZGVudGlhbCh0aGlzLl90eXBlSUQpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFNFQ1BNdWx0aXNpZ0NyZWRlbnRpYWwoXG4gICAgICBhcmdzLmxlbmd0aCA9PSAxID8gYXJnc1swXSA6IHRoaXMuX3R5cGVJRFxuICAgICkgYXMgdGhpc1xuICB9XG5cbiAgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogQ3JlZGVudGlhbCB7XG4gICAgaWYgKGlkID09PSB0aGlzLl90eXBlSUQpIHJldHVybiB0aGlzLmNyZWF0ZShhcmdzKVxuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICBjb25zdCBzaWdJZHhsZW46IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuc2lnSWR4cyA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaWdJZHhsZW47IGkrKykge1xuICAgICAgY29uc3Qgc2lnSWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICAgIG9mZnNldCA9IHNpZ0lkeC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdJZHgpXG4gICAgfVxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgLy8gVGhlIHNpZ25hdHVyZXNcbiAgICBjb25zdCBzdXBlckJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcblxuICAgIGNvbnN0IHNpZ0lkeGxlbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgc2lnSWR4bGVuLndyaXRlSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3N1cGVyQnVmZiwgc2lnSWR4bGVuXVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gc3VwZXJCdWZmLmxlbmd0aCArIHNpZ0lkeGxlbi5sZW5ndGhcblxuICAgIGZvciAoY29uc3Qgc2lnSWR4IG9mIHRoaXMuc2lnSWR4cykge1xuICAgICAgY29uc3Qgc2lnSWR4QnVmZjogQnVmZmVyID0gc2lnSWR4LnRvQnVmZmVyKClcbiAgICAgIGJzaXplICs9IHNpZ0lkeEJ1ZmYubGVuZ3RoXG4gICAgICBiYXJyLnB1c2goc2lnSWR4QnVmZilcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICBjb25zdHJ1Y3Rvcih0eXBlSUQ6IG51bWJlciwgc2lnSWR4cz86IFNpZ0lkeFtdLCBzaWdhcnJheT86IFNpZ25hdHVyZVtdKSB7XG4gICAgc3VwZXIoc2lnYXJyYXkpXG4gICAgdGhpcy5fdHlwZUlEID0gdHlwZUlEXG4gICAgaWYgKHNpZ0lkeHMpIHRoaXMuc2lnSWR4cyA9IHNpZ0lkeHNcbiAgfVxufVxuIl19