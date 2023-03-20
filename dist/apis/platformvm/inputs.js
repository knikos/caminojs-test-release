"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockedIn = exports.StakeableLockIn = exports.SECPTransferInput = exports.AmountInput = exports.TransferableInput = exports.ParseableInput = exports.SelectInputClass = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-Inputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const input_1 = require("../../common/input");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const locked_1 = require("./locked");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
const SelectInputClass = (inputid, ...args) => {
    if (inputid === constants_1.PlatformVMConstants.SECPINPUTID) {
        return new SECPTransferInput(...args);
    }
    else if (inputid === constants_1.PlatformVMConstants.STAKEABLELOCKINID) {
        return new StakeableLockIn(...args);
    }
    else if (inputid === constants_1.PlatformVMConstants.LOCKEDINID) {
        return new LockedIn(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InputIdError("Error - SelectInputClass: unknown inputid");
};
exports.SelectInputClass = SelectInputClass;
class ParseableInput extends input_1.StandardParseableInput {
    constructor() {
        super(...arguments);
        this._typeName = "ParseableInput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.input = (0, exports.SelectInputClass)(fields["input"]["_typeID"]);
        this.input.deserialize(fields["input"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        const inputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.input = (0, exports.SelectInputClass)(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
}
exports.ParseableInput = ParseableInput;
class TransferableInput extends input_1.StandardTransferableInput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableInput";
        this._typeID = undefined;
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
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.PlatformVMConstants.ASSETIDLEN);
        offset += 32;
        const inputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.input = (0, exports.SelectInputClass)(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
    static fromArray(b) {
        let offset = 6; //version + counter
        let num = b.readUInt32BE(2);
        const result = [];
        while (offset < b.length && num-- > 0) {
            const t = new TransferableInput();
            offset = t.fromBuffer(b, offset);
            result.push(t);
        }
        return result;
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
        this._typeID = constants_1.PlatformVMConstants.SECPINPUTID;
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
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
/**
 * An [[Input]] class which specifies an input that has a locktime which can also
 * enable staking of the value held, preventing transfers but not validation.
 */
class StakeableLockIn extends ParseableInput {
    /**
     * A [[Input]] class which specifies an [[Input]] that has a locktime which can also
     * enable staking of the value held, preventing transfers but not validation.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
     * @param transferableInput A [[ParseableInput]] which is embedded into this input.
     */
    constructor(amount = undefined, stakeableLocktime = undefined, transferableInput = undefined) {
        super(typeof transferableInput !== "undefined"
            ? transferableInput.getInput()
            : new SECPTransferInput(amount));
        this._typeName = "StakeableLockIn";
        this._typeID = constants_1.PlatformVMConstants.STAKEABLELOCKOUTID;
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
        if (typeof stakeableLocktime !== "undefined") {
            this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8);
        }
    }
    //serialize and deserialize both are inherited
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let outobj = Object.assign(Object.assign({}, fields), { stakeableLocktime: serialization.encoder(this.stakeableLocktime, encoding, "Buffer", "decimalString", 8) });
        return outobj;
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.stakeableLocktime = serialization.decoder(fields["stakeableLocktime"], encoding, "decimalString", "Buffer", 8);
    }
    getStakeableLocktime() {
        return bintools.fromBufferToBN(this.stakeableLocktime);
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockOut]] and returns the size of the output.
     */
    fromBuffer(outbuff, offset = 0) {
        this.stakeableLocktime = bintools.copyFrom(outbuff, offset, offset + 8);
        offset += 8;
        offset = super.fromBuffer(outbuff, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[StakeableLockOut]] instance.
     */
    toBuffer() {
        const superBuf = super.toBuffer();
        return buffer_1.Buffer.concat([this.stakeableLocktime, superBuf], superBuf.length + 8);
    }
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    create(...args) {
        return new StakeableLockIn(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    /**
     * Returns the amount from the underlying input
     */
    getAmount() {
        return this.getInput().getAmount();
    }
    /**
     * Backwards compatibility
     */
    getTransferableInput() {
        return this;
    }
}
exports.StakeableLockIn = StakeableLockIn;
/**
 * An [[Input]] class which specifies an input that is controlled by deposit and bond tx.
 */
class LockedIn extends ParseableInput {
    /**
     * An [[Input]] class which specifies an input that is controlled by deposit and bond tx.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     */
    constructor(amount = undefined) {
        super(new SECPTransferInput(amount));
        this._typeName = "LockedIn";
        this._typeID = constants_1.PlatformVMConstants.LOCKEDINID;
        this.ids = new locked_1.LockedIDs();
        /**
         * Returns the credentialID for this input
         */
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let outobj = Object.assign(Object.assign({}, fields), { ids: this.ids.serialize() });
        return outobj;
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.ids.deserialize(fields["ids"], encoding);
    }
    getLockedIDs() {
        return this.ids;
    }
    create(...args) {
        return new LockedIn(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer}
     * representing the [[LockedIn]] and returns the size of the input.
     */
    fromBuffer(outbuff, offset = 0) {
        offset = this.ids.fromBuffer(outbuff, offset);
        offset = super.fromBuffer(outbuff, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[LockedIn]] instance.
     */
    toBuffer() {
        const idsBuf = this.ids.toBuffer();
        const superBuff = super.toBuffer();
        return buffer_1.Buffer.concat([idsBuf, superBuff], superBuff.length + 64);
    }
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    /**
     * Returns the amount from the underlying input
     */
    getAmount() {
        return this.getInput().getAmount();
    }
}
exports.LockedIn = LockedIn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9pbnB1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBaUQ7QUFDakQsOENBSzJCO0FBQzNCLDZEQUE2RTtBQUU3RSwrQ0FBaUQ7QUFDakQscUNBQW9DO0FBRXBDOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7Ozs7O0dBTUc7QUFDSSxNQUFNLGdCQUFnQixHQUFHLENBQzlCLE9BQWUsRUFDZixHQUFHLElBQVcsRUFDSCxFQUFFO0lBQ2IsSUFBSSxPQUFPLEtBQUssK0JBQW1CLENBQUMsV0FBVyxFQUFFO1FBQy9DLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ3RDO1NBQU0sSUFBSSxPQUFPLEtBQUssK0JBQW1CLENBQUMsaUJBQWlCLEVBQUU7UUFDNUQsT0FBTyxJQUFJLGVBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ3BDO1NBQU0sSUFBSSxPQUFPLEtBQUssK0JBQW1CLENBQUMsVUFBVSxFQUFFO1FBQ3JELE9BQU8sSUFBSSxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUM3QjtJQUNELDBCQUEwQjtJQUMxQixNQUFNLElBQUkscUJBQVksQ0FBQywyQ0FBMkMsQ0FBQyxDQUFBO0FBQ3JFLENBQUMsQ0FBQTtBQWJZLFFBQUEsZ0JBQWdCLG9CQWE1QjtBQUVELE1BQWEsY0FBZSxTQUFRLDhCQUFzQjtJQUExRDs7UUFDWSxjQUFTLEdBQUcsZ0JBQWdCLENBQUE7UUFDNUIsWUFBTyxHQUFHLFNBQVMsQ0FBQTtJQWlCL0IsQ0FBQztJQWZD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RjtBQWpGRCw0QkFpRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1JbnB1dHNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7XG4gIEJhc2VJbnB1dCxcbiAgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCxcbiAgU3RhbmRhcmRBbW91bnRJbnB1dCxcbiAgU3RhbmRhcmRQYXJzZWFibGVJbnB1dFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2lucHV0XCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IHsgSW5wdXRJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgeyBMb2NrZWRJRHMgfSBmcm9tIFwiLi9sb2NrZWRcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIFRha2VzIGEgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0IGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tJbnB1dF1dIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbnB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbSW5wdXRdXS1leHRlbmRlZCBjbGFzcy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdElucHV0Q2xhc3MgPSAoXG4gIGlucHV0aWQ6IG51bWJlcixcbiAgLi4uYXJnczogYW55W11cbik6IEJhc2VJbnB1dCA9PiB7XG4gIGlmIChpbnB1dGlkID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEKSB7XG4gICAgcmV0dXJuIG5ldyBTRUNQVHJhbnNmZXJJbnB1dCguLi5hcmdzKVxuICB9IGVsc2UgaWYgKGlucHV0aWQgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuU1RBS0VBQkxFTE9DS0lOSUQpIHtcbiAgICByZXR1cm4gbmV3IFN0YWtlYWJsZUxvY2tJbiguLi5hcmdzKVxuICB9IGVsc2UgaWYgKGlucHV0aWQgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuTE9DS0VESU5JRCkge1xuICAgIHJldHVybiBuZXcgTG9ja2VkSW4oLi4uYXJncylcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICB0aHJvdyBuZXcgSW5wdXRJZEVycm9yKFwiRXJyb3IgLSBTZWxlY3RJbnB1dENsYXNzOiB1bmtub3duIGlucHV0aWRcIilcbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlYWJsZUlucHV0IGV4dGVuZHMgU3RhbmRhcmRQYXJzZWFibGVJbnB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlBhcnNlYWJsZUlucHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmlucHV0ID0gU2VsZWN0SW5wdXRDbGFzcyhmaWVsZHNbXCJpbnB1dFwiXVtcIl90eXBlSURcIl0pXG4gICAgdGhpcy5pbnB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpbnB1dFwiXSwgZW5jb2RpbmcpXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgY29uc3QgaW5wdXRpZDogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5pbnB1dCA9IFNlbGVjdElucHV0Q2xhc3MoaW5wdXRpZClcbiAgICByZXR1cm4gdGhpcy5pbnB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZUlucHV0IGV4dGVuZHMgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlRyYW5zZmVyYWJsZUlucHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuaW5wdXQgPSBTZWxlY3RJbnB1dENsYXNzKGZpZWxkc1tcImlucHV0XCJdW1wiX3R5cGVJRFwiXSlcbiAgICB0aGlzLmlucHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcImlucHV0XCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSBbW1RyYW5zZmVyYWJsZUlucHV0XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbVHJhbnNmZXJhYmxlSW5wdXRdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oXG4gICAgICBieXRlcyxcbiAgICAgIG9mZnNldCxcbiAgICAgIG9mZnNldCArIFBsYXRmb3JtVk1Db25zdGFudHMuQVNTRVRJRExFTlxuICAgIClcbiAgICBvZmZzZXQgKz0gMzJcbiAgICBjb25zdCBpbnB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLmlucHV0ID0gU2VsZWN0SW5wdXRDbGFzcyhpbnB1dGlkKVxuICAgIHJldHVybiB0aGlzLmlucHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQXJyYXkoYjogQnVmZmVyKTogVHJhbnNmZXJhYmxlSW5wdXRbXSB7XG4gICAgbGV0IG9mZnNldCA9IDYgLy92ZXJzaW9uICsgY291bnRlclxuICAgIGxldCBudW0gPSBiLnJlYWRVSW50MzJCRSgyKVxuICAgIGNvbnN0IHJlc3VsdDogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgd2hpbGUgKG9mZnNldCA8IGIubGVuZ3RoICYmIG51bS0tID4gMCkge1xuICAgICAgY29uc3QgdCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXG4gICAgICBvZmZzZXQgPSB0LmZyb21CdWZmZXIoYiwgb2Zmc2V0KVxuICAgICAgcmVzdWx0LnB1c2godClcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBbW91bnRJbnB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50SW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRJbnB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IEJhc2VJbnB1dCB7XG4gICAgcmV0dXJuIFNlbGVjdElucHV0Q2xhc3MoaWQsIC4uLmFyZ3MpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNFQ1BUcmFuc2ZlcklucHV0IGV4dGVuZHMgQW1vdW50SW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQVHJhbnNmZXJJbnB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQSU5QVVRJRFxuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5wdXRJRCBmb3IgdGhpcyBpbnB1dFxuICAgKi9cbiAgZ2V0SW5wdXRJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIGdldENyZWRlbnRpYWxJRCA9ICgpOiBudW1iZXIgPT4gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVySW5wdXQoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3b3V0OiBTRUNQVHJhbnNmZXJJbnB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXG4gIH1cbn1cblxuLyoqXG4gKiBBbiBbW0lucHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIGlucHV0IHRoYXQgaGFzIGEgbG9ja3RpbWUgd2hpY2ggY2FuIGFsc29cbiAqIGVuYWJsZSBzdGFraW5nIG9mIHRoZSB2YWx1ZSBoZWxkLCBwcmV2ZW50aW5nIHRyYW5zZmVycyBidXQgbm90IHZhbGlkYXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGFrZWFibGVMb2NrSW4gZXh0ZW5kcyBQYXJzZWFibGVJbnB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YWtlYWJsZUxvY2tJblwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5TVEFLRUFCTEVMT0NLT1VUSURcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIGxldCBvdXRvYmo6IG9iamVjdCA9IHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIHN0YWtlYWJsZUxvY2t0aW1lOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgICAgOFxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gb3V0b2JqXG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnN0YWtlYWJsZUxvY2t0aW1lID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wic3Rha2VhYmxlTG9ja3RpbWVcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDhcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgc3Rha2VhYmxlTG9ja3RpbWU6IEJ1ZmZlclxuXG4gIGdldFN0YWtlYWJsZUxvY2t0aW1lKCk6IEJOIHtcbiAgICByZXR1cm4gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5zdGFrZWFibGVMb2NrdGltZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tTdGFrZWFibGVMb2NrT3V0XV0gYW5kIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIG91dHB1dC5cbiAgICovXG4gIGZyb21CdWZmZXIob3V0YnVmZjogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBiaW50b29scy5jb3B5RnJvbShvdXRidWZmLCBvZmZzZXQsIG9mZnNldCArIDgpXG4gICAgb2Zmc2V0ICs9IDhcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKG91dGJ1ZmYsIG9mZnNldClcbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tTdGFrZWFibGVMb2NrT3V0XV0gaW5zdGFuY2UuXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyQnVmID0gc3VwZXIudG9CdWZmZXIoKVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFxuICAgICAgW3RoaXMuc3Rha2VhYmxlTG9ja3RpbWUsIHN1cGVyQnVmXSxcbiAgICAgIHN1cGVyQnVmLmxlbmd0aCArIDhcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5wdXRJRCBmb3IgdGhpcyBpbnB1dFxuICAgKi9cbiAgZ2V0SW5wdXRJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIGdldENyZWRlbnRpYWxJRCA9ICgpOiBudW1iZXIgPT4gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgU3Rha2VhYmxlTG9ja0luKC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld291dDogU3Rha2VhYmxlTG9ja0luID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhbW91bnQgZnJvbSB0aGUgdW5kZXJseWluZyBpbnB1dFxuICAgKi9cbiAgZ2V0QW1vdW50KCk6IEJOIHtcbiAgICByZXR1cm4gKHRoaXMuZ2V0SW5wdXQoKSBhcyBTdGFuZGFyZEFtb3VudElucHV0KS5nZXRBbW91bnQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAqL1xuICBnZXRUcmFuc2ZlcmFibGVJbnB1dCgpOiBQYXJzZWFibGVJbnB1dCB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBBIFtbSW5wdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gW1tJbnB1dF1dIHRoYXQgaGFzIGEgbG9ja3RpbWUgd2hpY2ggY2FuIGFsc29cbiAgICogZW5hYmxlIHN0YWtpbmcgb2YgdGhlIHZhbHVlIGhlbGQsIHByZXZlbnRpbmcgdHJhbnNmZXJzIGJ1dCBub3QgdmFsaWRhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGFtb3VudCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgYW1vdW50IGluIHRoZSBpbnB1dFxuICAgKiBAcGFyYW0gc3Rha2VhYmxlTG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIHN0YWtlYWJsZSBsb2NrdGltZVxuICAgKiBAcGFyYW0gdHJhbnNmZXJhYmxlSW5wdXQgQSBbW1BhcnNlYWJsZUlucHV0XV0gd2hpY2ggaXMgZW1iZWRkZWQgaW50byB0aGlzIGlucHV0LlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYW1vdW50OiBCTiA9IHVuZGVmaW5lZCxcbiAgICBzdGFrZWFibGVMb2NrdGltZTogQk4gPSB1bmRlZmluZWQsXG4gICAgdHJhbnNmZXJhYmxlSW5wdXQ6IFBhcnNlYWJsZUlucHV0ID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgdHlwZW9mIHRyYW5zZmVyYWJsZUlucHV0ICE9PSBcInVuZGVmaW5lZFwiXG4gICAgICAgID8gdHJhbnNmZXJhYmxlSW5wdXQuZ2V0SW5wdXQoKVxuICAgICAgICA6IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpXG4gICAgKVxuICAgIGlmICh0eXBlb2Ygc3Rha2VhYmxlTG9ja3RpbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuc3Rha2VhYmxlTG9ja3RpbWUgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihzdGFrZWFibGVMb2NrdGltZSwgOClcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBbW0lucHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIGlucHV0IHRoYXQgaXMgY29udHJvbGxlZCBieSBkZXBvc2l0IGFuZCBib25kIHR4LlxuICovXG5leHBvcnQgY2xhc3MgTG9ja2VkSW4gZXh0ZW5kcyBQYXJzZWFibGVJbnB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkxvY2tlZEluXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkxPQ0tFRElOSURcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIGxldCBvdXRvYmo6IG9iamVjdCA9IHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGlkczogdGhpcy5pZHMuc2VyaWFsaXplKClcbiAgICB9XG4gICAgcmV0dXJuIG91dG9ialxuICB9XG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmlkcy5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpZHNcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgcHJvdGVjdGVkIGlkczogTG9ja2VkSURzID0gbmV3IExvY2tlZElEcygpXG5cbiAgZ2V0TG9ja2VkSURzKCk6IExvY2tlZElEcyB7XG4gICAgcmV0dXJuIHRoaXMuaWRzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IExvY2tlZEluKC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld291dDogTG9ja2VkSW4gPSB0aGlzLmNyZWF0ZSgpXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogcmVwcmVzZW50aW5nIHRoZSBbW0xvY2tlZEluXV0gYW5kIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIGlucHV0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihvdXRidWZmOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gdGhpcy5pZHMuZnJvbUJ1ZmZlcihvdXRidWZmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihvdXRidWZmLCBvZmZzZXQpXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTG9ja2VkSW5dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgaWRzQnVmOiBCdWZmZXIgPSB0aGlzLmlkcy50b0J1ZmZlcigpXG4gICAgY29uc3Qgc3VwZXJCdWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoW2lkc0J1Ziwgc3VwZXJCdWZmXSwgc3VwZXJCdWZmLmxlbmd0aCArIDY0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlucHV0SUQgZm9yIHRoaXMgaW5wdXRcbiAgICovXG4gIGdldElucHV0SUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3JlZGVudGlhbElEIGZvciB0aGlzIGlucHV0XG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQgPSAoKTogbnVtYmVyID0+IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYW1vdW50IGZyb20gdGhlIHVuZGVybHlpbmcgaW5wdXRcbiAgICovXG4gIGdldEFtb3VudCgpOiBCTiB7XG4gICAgcmV0dXJuICh0aGlzLmdldElucHV0KCkgYXMgU3RhbmRhcmRBbW91bnRJbnB1dCkuZ2V0QW1vdW50KClcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW0lucHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIGlucHV0IHRoYXQgaXMgY29udHJvbGxlZCBieSBkZXBvc2l0IGFuZCBib25kIHR4LlxuICAgKlxuICAgKiBAcGFyYW0gYW1vdW50IEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBhbW91bnQgaW4gdGhlIGlucHV0XG4gICAqL1xuICBjb25zdHJ1Y3RvcihhbW91bnQ6IEJOID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIobmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtb3VudCkpXG4gIH1cbn1cbiJdfQ==