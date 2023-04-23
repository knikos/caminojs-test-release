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
    constructor(addressIdx, address) {
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
        /**
         * Retrieves the index buffer for the signature
         */
        this.getBytes = () => this.bytes;
        if (addressIdx)
            this.bytes.writeUInt32BE(addressIdx, 0);
        if (address)
            this.setSource(address);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILHFDQUFpQztBQUNqQyxvQ0FBZ0M7QUFDaEMsaUVBQXdDO0FBQ3hDLDBEQUkrQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNO0lBb0RoQzs7T0FFRztJQUNILFlBQVksVUFBbUIsRUFBRSxPQUFnQjtRQUMvQyxLQUFLLEVBQUUsQ0FBQTtRQXZEQyxjQUFTLEdBQUcsUUFBUSxDQUFBO1FBQ3BCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUFtQm5CLFdBQU0sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2pDLFVBQUssR0FBRyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZCLFVBQUssR0FBRyxDQUFDLENBQUE7UUFFbkI7O1dBRUc7UUFDSCxjQUFTLEdBQUcsQ0FBQyxPQUFlLEVBQUUsRUFBRTtZQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtRQUN2QixDQUFDLENBQUE7UUFFRDs7V0FFRztRQUNILGNBQVMsR0FBRyxHQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBRXJDOztXQUVHO1FBQ0gsYUFBUSxHQUFHLEdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUE7UUFpQmpDLElBQUksVUFBVTtZQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUN2RCxJQUFJLE9BQU87WUFBRSxJ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QUMsTUFBTSxDQUFDLENBQUE7U0FDMUI7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFRCxRQUFRO1FBQ04saUJBQWlCO1FBQ2pCLE1BQU0sU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUUxQyxNQUFNLFNBQVMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3pDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDOUMsTUFBTSxJQUFJLEdBQWEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDN0MsSUFBSSxLQUFLLEdBQVcsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO1FBRXZELEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQyxNQUFNLFVBQVUsR0FBVyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDNUMsS0FBSyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUE7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtTQUN0QjtRQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDbkMsQ0FBQztDQU9GO0FBbEVELHdEQWtFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIENvbW1vbi1TaWduYXR1cmVcbiAqL1xuaW1wb3J0IHsgTkJ5dGVzIH0gZnJvbSBcIi4vbmJ5dGVzXCJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHtcbiAgU2VyaWFsaXphYmxlLFxuICBTZXJpYWxpemF0aW9uLFxuICBTZXJpYWxpemVkRW5jb2Rpbmdcbn0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGEgW1tTaWduYXR1cmVdXSBpbmRleCB1c2VkIGluIFtbSW5wdXRdXVxuICovXG5leHBvcnQgY2xhc3MgU2lnSWR4IGV4dGVuZHMgTkJ5dGVzIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU2lnSWR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgc291cmNlOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5zb3VyY2UsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImhleFwiKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuc291cmNlID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wic291cmNlXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImhleFwiLFxuICAgICAgXCJCdWZmZXJcIlxuICAgIClcbiAgfVxuXG4gIHByb3RlY3RlZCBzb3VyY2U6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyMClcbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBic2l6ZSA9IDRcblxuICAvKipcbiAgICogU2V0cyB0aGUgc291cmNlIGFkZHJlc3MgZm9yIHRoZSBzaWduYXR1cmVcbiAgICovXG4gIHNldFNvdXJjZSA9IChhZGRyZXNzOiBCdWZmZXIpID0+IHtcbiAgICB0aGlzLnNvdXJjZSA9IGFkZHJlc3NcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHNvdXJjZSBhZGRyZXNzIGZvciB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBnZXRTb3VyY2UgPSAoKTogQnVmZmVyID0+IHRoaXMuc291cmNlXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgaW5kZXggYnVmZmVyIGZvciB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBnZXRCeXRlcyA9ICgpOiBCdWZmZXIgPT4gdGhpcy5ieXRlc1xuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGxldCBuZXdiYXNlOiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSgpOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFNpZ0lkeCgpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBUeXBlIHJlcHJlc2VudGluZyBhIFtbU2lnbmF0dXJlXV0gaW5kZXggdXNlZCBpbiBbW0lucHV0XV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3NJZHg/OiBudW1iZXIsIGFkZHJlc3M/OiBCdWZmZXIpIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKGFkZHJlc3NJZHgpIHRoaXMuYnl0ZXMud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxuICAgIGlmIChhZGRyZXNzKSB0aGlzLnNldFNvdXJjZShhZGRyZXNzKVxuICB9XG59XG5cbi8qKlxuICogU2lnbmF0dXJlIGZvciBhIFtbVHhdXVxuICovXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlIGV4dGVuZHMgTkJ5dGVzIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU2lnbmF0dXJlXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDY1KVxuICBwcm90ZWN0ZWQgYnNpemUgPSA2NVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGxldCBuZXdiYXNlOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSgpOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFNpZ25hdHVyZSgpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduYXR1cmUgZm9yIGEgW1tUeF1dXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENyZWRlbnRpYWwgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJDcmVkZW50aWFsXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgc2lnQXJyYXk6IHRoaXMuc2lnQXJyYXkubWFwKChzKSA9PiBzLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5zaWdBcnJheSA9IGZpZWxkc1tcInNpZ0FycmF5XCJdLm1hcCgoczogb2JqZWN0KSA9PiB7XG4gICAgICBsZXQgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgIHNpZy5kZXNlcmlhbGl6ZShzLCBlbmNvZGluZylcbiAgICAgIHJldHVybiBzaWdcbiAgICB9KVxuICB9XG5cbiAgcHJvdGVjdGVkIHNpZ0FycmF5OiBTaWduYXR1cmVbXSA9IFtdXG5cbiAgZ2V0Q3JlZGVudGlhbElEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29kZWNJRFxuICAgKlxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBzaWduYXR1cmUgdG8gdGhlIGNyZWRlbnRpYWxzIGFuZCByZXR1cm5zIHRoZSBpbmRleCBvZmYgdGhlIGFkZGVkIHNpZ25hdHVyZS5cbiAgICovXG4gIGFkZFNpZ25hdHVyZSA9IChzaWc6IFNpZ25hdHVyZSk6IG51bWJlciA9PiB7XG4gICAgdGhpcy5zaWdBcnJheS5wdXNoKHNpZylcbiAgICByZXR1cm4gdGhpcy5zaWdBcnJheS5sZW5ndGggLSAxXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgY29uc3Qgc2lnbGVuOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLnNpZ0FycmF5ID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2lnbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXG4gICAgICBvZmZzZXQgPSBzaWcuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy5zaWdBcnJheS5wdXNoKHNpZylcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzaWdsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHNpZ2xlbi53cml0ZUludDMyQkUodGhpcy5zaWdBcnJheS5sZW5ndGgsIDApXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbc2lnbGVuXVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gc2lnbGVuLmxlbmd0aFxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLnNpZ0FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaWdidWZmOiBCdWZmZXIgPSB0aGlzLnNpZ0FycmF5W2Ake2l9YF0udG9CdWZmZXIoKVxuICAgICAgYnNpemUgKz0gc2lnYnVmZi5sZW5ndGhcbiAgICAgIGJhcnIucHVzaChzaWdidWZmKVxuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xuICBhYnN0cmFjdCBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBDcmVkZW50aWFsXG4gIGNvbnN0cnVjdG9yKHNpZ2FycmF5OiBTaWduYXR1cmVbXSA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICBpZiAodHlwZW9mIHNpZ2FycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhpcy5zaWdBcnJheSA9IHNpZ2FycmF5XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTRUNQTXVsdGlzaWdDcmVkZW50aWFsIGV4dGVuZHMgQ3JlZGVudGlhbCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BNdWx0aXNpZ0NyZWRlbnRpYWxcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBzaWdJZHhzOiBTaWdJZHhbXSA9IFtdXG5cbiAgLyoqXG4gICAqIEFkZHMgYSBTaWduYXR1cmVJbmRleCB0byB0aGUgY3JlZGVudGlhbHMuXG4gICAqL1xuICBhZGRTU2lnbmF0dXJlSW5kZXggPSAoc2lnSWR4OiBTaWdJZHgpOiB2b2lkID0+IHtcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdJZHgpXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdiYXNlID0gbmV3IFNFQ1BNdWx0aXNpZ0NyZWRlbnRpYWwodGhpcy5fdHlwZUlEKVxuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBTRUNQTXVsdGlzaWdDcmVkZW50aWFsKFxuICAgICAgYXJncy5sZW5ndGggPT0gMSA/IGFyZ3NbMF0gOiB0aGlzLl90eXBlSURcbiAgICApIGFzIHRoaXNcbiAgfVxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IENyZWRlbnRpYWwge1xuICAgIGlmIChpZCA9PT0gdGhpcy5fdHlwZUlEKSByZXR1cm4gdGhpcy5jcmVhdGUoYXJncylcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgY29uc3Qgc2lnSWR4bGVuOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLnNpZ0lkeHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2lnSWR4bGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IHNpZ0lkeDogU2lnSWR4ID0gbmV3IFNpZ0lkeCgpXG4gICAgICBvZmZzZXQgPSBzaWdJZHguZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy5zaWdJZHhzLnB1c2goc2lnSWR4KVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIC8vIFRoZSBzaWduYXR1cmVzXG4gICAgY29uc3Qgc3VwZXJCdWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG5cbiAgICBjb25zdCBzaWdJZHhsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHNpZ0lkeGxlbi53cml0ZUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlckJ1ZmYsIHNpZ0lkeGxlbl1cbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHN1cGVyQnVmZi5sZW5ndGggKyBzaWdJZHhsZW4ubGVuZ3RoXG5cbiAgICBmb3IgKGNvbnN0IHNpZ0lkeCBvZiB0aGlzLnNpZ0lkeHMpIHtcbiAgICAgIGNvbnN0IHNpZ0lkeEJ1ZmY6IEJ1ZmZlciA9IHNpZ0lkeC50b0J1ZmZlcigpXG4gICAgICBic2l6ZSArPSBzaWdJZHhCdWZmLmxlbmd0aFxuICAgICAgYmFyci5wdXNoKHNpZ0lkeEJ1ZmYpXG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY29uc3RydWN0b3IodHlwZUlEOiBudW1iZXIsIHNpZ0lkeHM/OiBTaWdJZHhbXSwgc2lnYXJyYXk/OiBTaWduYXR1cmVbXSkge1xuICAgIHN1cGVyKHNpZ2FycmF5KVxuICAgIHRoaXMuX3R5cGVJRCA9IHR5cGVJRFxuICAgIGlmIChzaWdJZHhzKSB0aGlzLnNpZ0lkeHMgPSBzaWdJZHhzXG4gIH1cbn1cbiJdfQ==