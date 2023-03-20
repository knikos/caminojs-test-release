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
        bsize += barr[barr.length - 1].length;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwb3NpdFR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9kZXBvc2l0VHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBaUQ7QUFHakQscUNBQWlDO0FBQ2pDLHFEQUF3RDtBQUN4RCw2REFBNkU7QUFFN0U7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxTQUFVLFNBQVEsZUFBTTtJQWlJbkM7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsT0FBNkIsU0FBUyxFQUN0QyxNQUEyQixTQUFTLEVBQ3BDLE9BQWUsU0FBUyxFQUN4QixpQkFBa0MsU0FBUyxFQUMzQyxrQkFBbUMsU0FBUyxFQUM1QyxlQUFnQyxTQUFTO1FBRXpDLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUF0SnZDLGNBQVMsR0FBRyxXQUFXLENBQUE7UUFDdkIsWUFBTyxHQUFHLCtCQUFtQixDQUFDLFNBQVMsQ0FBQTtRQXdDakQsd0RBQXdEO1FBQzlDLG1CQUFjLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNuRCx5Q0FBeUM7UUFDL0Isb0JBQWUsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ25ELHFEQUFxRDtRQUMzQyxpQkFBWSxHQUFvQixTQUFTLENBQUE7UUF5R2pELElBQUksT0FBTyxjQUFj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Q0FBQTtRQUNuRSxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUVwRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixNQUFNLFNBQVMsR0FBVyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFFMUMsSUFBSSxLQUFLLEdBQ1AsU0FBUyxDQUFDLE1BQU07WUFDaEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNO1lBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFBO1FBQzdCLE1BQU0sSUFBSSxHQUFhO1lBQ3JCLFNBQVM7WUFDVCxJQUFJLENBQUMsY0FBYztZQUNuQixJQUFJLENBQUMsZUFBZTtTQUNyQixDQUFBO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDdkMsS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQTtRQUVyQyxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25DLENBQUM7SUFFRCxLQUFLO1FBQ0gsTUFBTSxZQUFZLEdBQWMsSUFBSSxTQUFTLEVBQUUsQ0FBQTtRQUMvQyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ3hDLE9BQU8sWUFBb0IsQ0FBQTtJQUM3QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDdkMsQ0FBQztDQTBDRjtBQXpLRCw4QkF5S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1EZXBvc2l0VHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFBhcnNlYWJsZU91dHB1dCwgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBEZXBvc2l0VHggdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBEZXBvc2l0VHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJEZXBvc2l0VHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuREVQT1NJVFRYXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGRlcG9zaXRPZmZlcklEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuZGVwb3NpdE9mZmVySUQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImNiNThcIlxuICAgICAgKSxcbiAgICAgIGRlcG9zaXREdXJhdGlvbjogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmRlcG9zaXREdXJhdGlvbixcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXG4gICAgICApLFxuICAgICAgcmV3YXJkc093bmVyOiB0aGlzLnJld2FyZHNPd25lci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5kZXBvc2l0T2ZmZXJJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImRlcG9zaXRPZmZlcklEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImNiNThcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAzMlxuICAgIClcbiAgICB0aGlzLmRlcG9zaXREdXJhdGlvbiA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImRlcG9zaXREdXJhdGlvblwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgNFxuICAgIClcbiAgICB0aGlzLnJld2FyZHNPd25lci5kZXNlcmlhbGl6ZShmaWVsZHNbXCJyZXdhcmRzT3duZXJcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gSUQgb2YgYWN0aXZlIG9mZmVyIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0aGlzIGRlcG9zaXRcbiAgcHJvdGVjdGVkIGRlcG9zaXRPZmZlcklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG4gIC8vIGR1cmF0aW9uIG9mIGRlcG9zaXQgKGluIDQgYnl0ZSBmb3JtYXQpXG4gIHByb3RlY3RlZCBkZXBvc2l0RHVyYXRpb246IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAvLyBXaGVyZSB0byBzZW5kIHN0YWtpbmcgcmV3YXJkcyB3aGVuIGRvbmUgdmFsaWRhdGluZ1xuICBwcm90ZWN0ZWQgcmV3YXJkc093bmVyOiBQYXJzZWFibGVPdXRwdXQgPSB1bmRlZmluZWRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbUmVnaXN0ZXJOb2RlVHhdXVxuICAgKi9cbiAgZ2V0VHhUeXBlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRlcG9zaXRPZmZlcklEXG4gICAqL1xuICBnZXREZXBvc2l0T2ZmZXJJRCgpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLmRlcG9zaXRPZmZlcklEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGVwb3NpdE9mZmVySURcbiAgICovXG4gIGdldERlcG9zaXREdXJhdGlvbigpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLmRlcG9zaXREdXJhdGlvblxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRlcG9zaXRPZmZlcklEXG4gICAqL1xuICBnZXRSZXdhcmRzT3duZXIoKTogUGFyc2VhYmxlT3V0cHV0IHtcbiAgICByZXR1cm4gdGhpcy5yZXdhcmRzT3duZXJcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSBbW0RlcG9zaXRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbRGVwb3NpdFR4XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tEZXBvc2l0VHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tEZXBvc2l0VHhdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMuZGVwb3NpdE9mZmVySUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICBvZmZzZXQgKz0gMzJcbiAgICB0aGlzLmRlcG9zaXREdXJhdGlvbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBvZmZzZXQgPSB0aGlzLnJld2FyZHNPd25lci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG5cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0RlcG9zaXRUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcblxuICAgIGxldCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggK1xuICAgICAgdGhpcy5kZXBvc2l0T2ZmZXJJRC5sZW5ndGggK1xuICAgICAgdGhpcy5kZXBvc2l0RHVyYXRpb24ubGVuZ3RoXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXG4gICAgICBzdXBlcmJ1ZmYsXG4gICAgICB0aGlzLmRlcG9zaXRPZmZlcklELFxuICAgICAgdGhpcy5kZXBvc2l0RHVyYXRpb25cbiAgICBdXG5cbiAgICBiYXJyLnB1c2godGhpcy5yZXdhcmRzT3duZXIudG9CdWZmZXIoKSlcbiAgICBic2l6ZSArPSBiYXJyW2JhcnIubGVuZ3RoIC0gMV0ubGVuZ3RoXG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld0RlcG9zaXRUeDogRGVwb3NpdFR4ID0gbmV3IERlcG9zaXRUeCgpXG4gICAgbmV3RGVwb3NpdFR4LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdEZXBvc2l0VHggYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBEZXBvc2l0VHgoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBSZWdpc3Rlck5vZGUgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIGRlcG9zaXRPZmZlcklEIE9wdGlvbmFsIElEIG9mIHRoZSBkZXBvc2l0IG9mZmVyLlxuICAgKiBAcGFyYW0gZHVyYXRpb24gT3B0aW9uYWwgRHVyYXRpb24gb2YgZGVwb3NpdGluZy5cbiAgICogQHBhcmFtIHJld2FyZHNPd25lciBPcHRpb25hbCB0aGUgb3duZXIgb2YgdGhlIHJld2FyZHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZGVwb3NpdE9mZmVySUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBkZXBvc2l0RHVyYXRpb246IG51bWJlciB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICByZXdhcmRzT3duZXI6IFBhcnNlYWJsZU91dHB1dCA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuICAgIGlmICh0eXBlb2YgZGVwb3NpdE9mZmVySUQgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiBkZXBvc2l0T2ZmZXJJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aGlzLmRlcG9zaXRPZmZlcklEID0gYmludG9vbHMuY2I1OERlY29kZShkZXBvc2l0T2ZmZXJJRClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVwb3NpdE9mZmVySUQgPSBkZXBvc2l0T2ZmZXJJRFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlcG9zaXREdXJhdGlvbiAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIGRlcG9zaXREdXJhdGlvbiA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aGlzLmRlcG9zaXREdXJhdGlvbiA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgICAgICB0aGlzLmRlcG9zaXREdXJhdGlvbi53cml0ZVVJbnQzMkJFKGRlcG9zaXREdXJhdGlvbiwgMClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVwb3NpdER1cmF0aW9uID0gZGVwb3NpdER1cmF0aW9uXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmV3YXJkc093bmVyID0gcmV3YXJkc093bmVyXG4gIH1cbn1cbiJdfQ==