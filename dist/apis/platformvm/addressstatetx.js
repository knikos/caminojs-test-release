"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressStateTx = exports.ADDRESSSTATEDEFERRED = exports.ADDRESSSTATECONSORTIUM = exports.ADDRESSSTATEKYCVERIFIED = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-AddressStateTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
exports.ADDRESSSTATEKYCVERIFIED = 32;
exports.ADDRESSSTATECONSORTIUM = 38;
exports.ADDRESSSTATEDEFERRED = 39;
/**
 * Class representing an unsigned AdressStateTx transaction.
 */
class AddressStateTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned RegisterNode transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param address Optional address to alter state.
     * @param state Optional state to alter.
     * @param remove Optional if true remove the flag, otherwise set
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, address = undefined, state = undefined, remove = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "AddressStateTx";
        this._typeID = constants_1.PlatformVMConstants.ADDRESSSTATETX;
        // The address to add / remove state
        this.address = buffer_1.Buffer.alloc(20);
        // The state to set / unset
        this.state = 0;
        if (typeof address != "undefined") {
            if (typeof address === "string") {
                this.address = bintools.stringToAddress(address);
            }
            else {
                this.address = address;
            }
        }
        if (typeof state != "undefined") {
            this.state = state;
        }
        if (typeof remove != "undefined") {
            this.remove = remove;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { address: serialization.encoder(this.address, encoding, "Buffer", "cb58"), state: this.state, remove: this.remove });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.address = serialization.decoder(fields["address"], encoding, "cb58", "Buffer", 20);
        this.state = fields["state"];
        this.remove = fields["remove"];
    }
    /**
     * Returns the id of the [[AddressStateTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the address
     */
    getAddress() {
        return this.address;
    }
    /**
     * Returns the state
     */
    getState() {
        return this.state;
    }
    /**
     * Returns the remove flag
     */
    getRemove() {
        return this.remove;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddressStateTx]], parses it, populates the class, and returns the length of the [[AddressStateTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddressStateTx]]
     *
     * @returns The length of the raw [[AddressStateTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.address = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.state = bintools.copyFrom(bytes, offset, offset + 1)[0];
        offset += 1;
        this.remove = bintools.copyFrom(bytes, offset, offset + 1)[0] != 0;
        offset += 1;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddressStateTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length + this.address.length + 2;
        const barr = [
            superbuff,
            this.address,
            buffer_1.Buffer.from([this.state]),
            buffer_1.Buffer.from([this.remove ? 1 : 0])
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newAddressStateTx = new AddressStateTx();
        newAddressStateTx.fromBuffer(this.toBuffer());
        return newAddressStateTx;
    }
    create(...args) {
        return new AddressStateTx(...args);
    }
}
exports.AddressStateTx = AddressStateTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkcmVzc3N0YXRldHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2FkZHJlc3NzdGF0ZXR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQWlEO0FBR2pELHFDQUFpQztBQUNqQyxxREFBd0Q7QUFDeEQsNkRBQTZFO0FBRTdFOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVuRCxRQUFBLHVCQUF1QixHQUFXLEVBQUUsQ0FBQTtBQUNwQyxRQUFBLHNCQUFzQixHQUFXLEVBQUUsQ0FBQTtBQUNuQyxRQUFBLG9CQUFvQixHQUFXLEVBQUUsQ0FBQTtBQUU5Qzs7R0FFRztBQUNILE1BQWEsY0FBZSxTQUFRLGVBQU07SUEyR3hDOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsVUFBMkIsU0FBUyxFQUNwQyxRQUFnQixTQUFTLEVBQ3pCLFNBQWtCLFNBQVM7UUFFM0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQWhJdkMsY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxjQUFjLENBQUE7UUF3QnRELG9DQUFvQztRQUMxQixZQUFPLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNwQywyQkFBMkI7UUFDakIs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Q0FBQTtRQUUxQyxJQUFJLEtBQUssR0FBVyxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUM5RCxNQUFNLElBQUksR0FBYTtZQUNyQixTQUFTO1lBQ1QsSUFBSSxDQUFDLE9BQU87WUFDWixlQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLGVBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ25DLENBQUE7UUFDRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7SUFFRCxLQUFLO1FBQ0gsTUFBTSxpQkFBaUIsR0FBbUIsSUFBSSxjQUFjLEVBQUUsQ0FBQTtRQUM5RCxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDN0MsT0FBTyxpQkFBeUIsQ0FBQTtJQUNsQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDNUMsQ0FBQztDQXVDRjtBQWhKRCx3Q0FnSkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1BZGRyZXNzU3RhdGVUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG5leHBvcnQgY29uc3QgQUREUkVTU1NUQVRFS1lDVkVSSUZJRUQ6IG51bWJlciA9IDMyXG5leHBvcnQgY29uc3QgQUREUkVTU1NUQVRFQ09OU09SVElVTTogbnVtYmVyID0gMzhcbmV4cG9ydCBjb25zdCBBRERSRVNTU1RBVEVERUZFUlJFRDogbnVtYmVyID0gMzlcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQWRyZXNzU3RhdGVUeCB0cmFuc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZHJlc3NTdGF0ZVR4IGV4dGVuZHMgQmFzZVR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQWRkcmVzc1N0YXRlVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuQUREUkVTU1NUQVRFVFhcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgYWRkcmVzczogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYWRkcmVzcywgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcbiAgICAgIHN0YXRlOiB0aGlzLnN0YXRlLFxuICAgICAgcmVtb3ZlOiB0aGlzLnJlbW92ZVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuYWRkcmVzcyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImFkZHJlc3NcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiY2I1OFwiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDIwXG4gICAgKVxuICAgIHRoaXMuc3RhdGUgPSBmaWVsZHNbXCJzdGF0ZVwiXVxuICAgIHRoaXMucmVtb3ZlID0gZmllbGRzW1wicmVtb3ZlXCJdXG4gIH1cblxuICAvLyBUaGUgYWRkcmVzcyB0byBhZGQgLyByZW1vdmUgc3RhdGVcbiAgcHJvdGVjdGVkIGFkZHJlc3MgPSBCdWZmZXIuYWxsb2MoMjApXG4gIC8vIFRoZSBzdGF0ZSB0byBzZXQgLyB1bnNldFxuICBwcm90ZWN0ZWQgc3RhdGUgPSAwXG4gIC8vIFJlbW92ZSBvciBhZGQgdGhlIGZsYWcgP1xuICBwcm90ZWN0ZWQgcmVtb3ZlOiBib29sZWFuXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0FkZHJlc3NTdGF0ZVR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzXG4gICAqL1xuICBnZXRBZGRyZXNzKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXRlXG4gICAqL1xuICBnZXRTdGF0ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN0YXRlXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcmVtb3ZlIGZsYWdcbiAgICovXG4gIGdldFJlbW92ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tBZGRyZXNzU3RhdGVUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbQWRkcmVzc1N0YXRlVHhdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0FkZHJlc3NTdGF0ZVR4XV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQWRkcmVzc1N0YXRlVHhdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMuYWRkcmVzcyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIwKVxuICAgIG9mZnNldCArPSAyMFxuICAgIHRoaXMuc3RhdGUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAxKVswXVxuICAgIG9mZnNldCArPSAxXG4gICAgdGhpcy5yZW1vdmUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAxKVswXSAhPSAwXG4gICAgb2Zmc2V0ICs9IDFcbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0FkZHJlc3NTdGF0ZVR4XV0uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxuXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoICsgdGhpcy5hZGRyZXNzLmxlbmd0aCArIDJcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtcbiAgICAgIHN1cGVyYnVmZixcbiAgICAgIHRoaXMuYWRkcmVzcyxcbiAgICAgIEJ1ZmZlci5mcm9tKFt0aGlzLnN0YXRlXSksXG4gICAgICBCdWZmZXIuZnJvbShbdGhpcy5yZW1vdmUgPyAxIDogMF0pXG4gICAgXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3QWRkcmVzc1N0YXRlVHg6IEFkZHJlc3NTdGF0ZVR4ID0gbmV3IEFkZHJlc3NTdGF0ZVR4KClcbiAgICBuZXdBZGRyZXNzU3RhdGVUeC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3QWRkcmVzc1N0YXRlVHggYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBBZGRyZXNzU3RhdGVUeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFJlZ2lzdGVyTm9kZSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gYWRkcmVzcyBPcHRpb25hbCBhZGRyZXNzIHRvIGFsdGVyIHN0YXRlLlxuICAgKiBAcGFyYW0gc3RhdGUgT3B0aW9uYWwgc3RhdGUgdG8gYWx0ZXIuXG4gICAqIEBwYXJhbSByZW1vdmUgT3B0aW9uYWwgaWYgdHJ1ZSByZW1vdmUgdGhlIGZsYWcsIG90aGVyd2lzZSBzZXRcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYWRkcmVzczogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIHN0YXRlOiBudW1iZXIgPSB1bmRlZmluZWQsXG4gICAgcmVtb3ZlOiBib29sZWFuID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aGlzLmFkZHJlc3MgPSBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYWRkcmVzcylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWRkcmVzcyA9IGFkZHJlc3NcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdGF0ZSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnN0YXRlID0gc3RhdGVcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZW1vdmUgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5yZW1vdmUgPSByZW1vdmVcbiAgICB9XG4gIH1cbn1cbiJdfQ==