"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-DepositTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned DepositTx transaction.
 */
class DepositTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned RegisterNode transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param depositOfferID Optional ID of the deposit offer.
     * @param duration Optional Duration of depositing.
     * @param rewardsOwner Optional the owner of the rewards
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, depositOfferID = undefined, depositDuration = undefined, rewardsOwner = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "DepositTx";
        this._typeID = constants_1.PlatformVMConstants.DEPOSITTX;
        // ID of active offer that will be used for this deposit
        this.depositOfferID = buffer_1.Buffer.alloc(32);
        // duration of deposit (in 4 byte format)
        this.depositDuration = buffer_1.Buffer.alloc(4);
        // Where to send staking rewards when done validating
        this.rewardsOwner = undefined;
        if (typeof depositOfferID != "undefined") {
            if (typeof depositOfferID === "string") {
                this.depositOfferID = bintools.cb58Decode(depositOfferID);
            }
            else {
                this.depositOfferID = depositOfferID;
            }
        }
        if (typeof depositDuration != "undefined") {
            if (typeof depositDuration === "number") {
                this.depositDuration = buffer_1.Buffer.alloc(4);
                this.depositDuration.writeUInt32BE(depositDuration, 0);
            }
            else {
                this.depositDuration = depositDuration;
            }
        }
        this.rewardsOwner = rewardsOwner;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { depositOfferID: serialization.encoder(this.depositOfferID, encoding, "Buffer", "cb58"), depositDuration: serialization.encoder(this.depositDuration, encoding, "Buffer", "decimalString"), rewardsOwner: this.rewardsOwner.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.depositOfferID = serialization.decoder(fields["depositOfferID"], encoding, "cb58", "Buffer", 32);
        this.depositDuration = serialization.decoder(fields["depositDuration"], encoding, "decimalString", "Buffer", 4);
        this.rewardsOwner.deserialize(fields["rewardsOwner"], encoding);
    }
    /**
     * Returns the id of the [[RegisterNodeTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the depositOfferID
     */
    getDepositOfferID() {
        return this.depositOfferID;
    }
    /**
     * Returns the depositOfferID
     */
    getDepositDuration() {
        return this.depositDuration;
    }
    /**
     * Returns the depositOfferID
     */
    getRewardsOwner() {
        return this.rewardsOwner;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[DepositTx]], parses it, populates the class, and returns the length of the [[DepositTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[DepositTx]]
     *
     * @returns The length of the raw [[DepositTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.depositOfferID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.depositDuration = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.rewardsOwner = new outputs_1.ParseableOutput();
        offset = this.rewardsOwner.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[DepositTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length +
            this.depositOfferID.length +
            this.depositDuration.length;
        const barr = [
            superbuff,
            this.depositOfferID,
            this.depositDuration
        ];
        barr.push(this.rewardsOwner.toBuffer());
        bsize += this.rewardsOwner.toBuffer().length;
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newDepositTx = new DepositTx();
        newDepositTx.fromBuffer(this.toBuffer());
        return newDepositTx;
    }
    create(...args) {
        return new DepositTx(...args);
    }
}
exports.DepositTx = DepositTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwb3NpdFR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9kZXBvc2l0VHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBaUQ7QUFDakQsdUNBQStEO0FBRS9ELHFDQUFpQztBQUNqQyxxREFBd0Q7QUFDeEQsNkRBQTZFO0FBRTdFOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsU0FBVSxTQUFRLGVBQU07SUFrSW5DOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsaUJBQWtDLFNBQVMsRUFDM0Msa0JBQW1DLFNBQVMsRUFDNUMsZUFBZ0MsU0FBUztRQUV6QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBdkp2QyxjQUFTLEdBQUcsV0FBVyxDQUFBO1FBQ3ZCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxTQUFTLENBQUE7UUF3Q2pELHdEQUF3RDtRQUM5QyxtQkFBYyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbkQseUNBQXlDO1FBQy9CLG9CQUFlLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuRCxxREFBcUQ7UUFDM0MsaUJBQVksR0FBb0IsU0FBUyxDQUFBO1FBMEdqRCxJ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KlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLURlcG9zaXRUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgUGFyc2VhYmxlT3V0cHV0LCBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIERlcG9zaXRUeCB0cmFuc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIERlcG9zaXRUeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkRlcG9zaXRUeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5ERVBPU0lUVFhcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgZGVwb3NpdE9mZmVySUQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5kZXBvc2l0T2ZmZXJJRCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiY2I1OFwiXG4gICAgICApLFxuICAgICAgZGVwb3NpdER1cmF0aW9uOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uLFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJCdWZmZXJcIixcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCJcbiAgICAgICksXG4gICAgICByZXdhcmRzT3duZXI6IHRoaXMucmV3YXJkc093bmVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmRlcG9zaXRPZmZlcklEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiZGVwb3NpdE9mZmVySURcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiY2I1OFwiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDMyXG4gICAgKVxuICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiZGVwb3NpdER1cmF0aW9uXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA0XG4gICAgKVxuICAgIHRoaXMucmV3YXJkc093bmVyLmRlc2VyaWFsaXplKGZpZWxkc1tcInJld2FyZHNPd25lclwiXSwgZW5jb2RpbmcpXG4gIH1cblxuICAvLyBJRCBvZiBhY3RpdmUgb2ZmZXIgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoaXMgZGVwb3NpdFxuICBwcm90ZWN0ZWQgZGVwb3NpdE9mZmVySUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgLy8gZHVyYXRpb24gb2YgZGVwb3NpdCAoaW4gNCBieXRlIGZvcm1hdClcbiAgcHJvdGVjdGVkIGRlcG9zaXREdXJhdGlvbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIC8vIFdoZXJlIHRvIHNlbmQgc3Rha2luZyByZXdhcmRzIHdoZW4gZG9uZSB2YWxpZGF0aW5nXG4gIHByb3RlY3RlZCByZXdhcmRzT3duZXI6IFBhcnNlYWJsZU91dHB1dCA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tSZWdpc3Rlck5vZGVUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGVwb3NpdE9mZmVySURcbiAgICovXG4gIGdldERlcG9zaXRPZmZlcklEKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZGVwb3NpdE9mZmVySURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkZXBvc2l0T2ZmZXJJRFxuICAgKi9cbiAgZ2V0RGVwb3NpdER1cmF0aW9uKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZGVwb3NpdER1cmF0aW9uXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGVwb3NpdE9mZmVySURcbiAgICovXG4gIGdldFJld2FyZHNPd25lcigpOiBQYXJzZWFibGVPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLnJld2FyZHNPd25lclxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIFtbRGVwb3NpdFR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tEZXBvc2l0VHhdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0RlcG9zaXRUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0RlcG9zaXRUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5kZXBvc2l0T2ZmZXJJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgIG9mZnNldCArPSAzMlxuICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMucmV3YXJkc093bmVyID0gbmV3IFBhcnNlYWJsZU91dHB1dCgpXG4gICAgb2Zmc2V0ID0gdGhpcy5yZXdhcmRzT3duZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tEZXBvc2l0VHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG5cbiAgICBsZXQgYnNpemU6IG51bWJlciA9XG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICtcbiAgICAgIHRoaXMuZGVwb3NpdE9mZmVySUQubGVuZ3RoICtcbiAgICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uLmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW1xuICAgICAgc3VwZXJidWZmLFxuICAgICAgdGhpcy5kZXBvc2l0T2ZmZXJJRCxcbiAgICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uXG4gICAgXVxuXG4gICAgYmFyci5wdXNoKHRoaXMucmV3YXJkc093bmVyLnRvQnVmZmVyKCkpXG4gICAgYnNpemUgKz0gdGhpcy5yZXdhcmRzT3duZXIudG9CdWZmZXIoKS5sZW5ndGhcblxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3RGVwb3NpdFR4OiBEZXBvc2l0VHggPSBuZXcgRGVwb3NpdFR4KClcbiAgICBuZXdEZXBvc2l0VHguZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld0RlcG9zaXRUeCBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IERlcG9zaXRUeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFJlZ2lzdGVyTm9kZSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gZGVwb3NpdE9mZmVySUQgT3B0aW9uYWwgSUQgb2YgdGhlIGRlcG9zaXQgb2ZmZXIuXG4gICAqIEBwYXJhbSBkdXJhdGlvbiBPcHRpb25hbCBEdXJhdGlvbiBvZiBkZXBvc2l0aW5nLlxuICAgKiBAcGFyYW0gcmV3YXJkc093bmVyIE9wdGlvbmFsIHRoZSBvd25lciBvZiB0aGUgcmV3YXJkc1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBkZXBvc2l0T2ZmZXJJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGRlcG9zaXREdXJhdGlvbjogbnVtYmVyIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIHJld2FyZHNPd25lcjogUGFyc2VhYmxlT3V0cHV0ID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gICAgaWYgKHR5cGVvZiBkZXBvc2l0T2ZmZXJJRCAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIGRlcG9zaXRPZmZlcklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRoaXMuZGVwb3NpdE9mZmVySUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGRlcG9zaXRPZmZlcklEKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZXBvc2l0T2ZmZXJJRCA9IGRlcG9zaXRPZmZlcklEXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZGVwb3NpdER1cmF0aW9uICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgZGVwb3NpdER1cmF0aW9uID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uLndyaXRlVUludDMyQkUoZGVwb3NpdER1cmF0aW9uLCAwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZXBvc2l0RHVyYXRpb24gPSBkZXBvc2l0RHVyYXRpb25cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXdhcmRzT3duZXIgPSByZXdhcmRzT3duZXJcbiAgfVxufVxuIl19