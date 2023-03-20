"use strict";
/**
 * @packageDocumentation
 * @module API-PlatformVM-Locked
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockedIDs = exports.SerializableTxID = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const serialization_1 = require("../../utils/serialization");
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
class SerializableTxID {
    constructor() {
        this.txid = buffer_1.Buffer.alloc(32);
    }
    encode(encoding = "hex") {
        return serialization.encoder(this.txid, encoding, "Buffer", "cb58");
    }
    decode(value, encoding = "hex") {
        this.txid = serialization.decoder(value, encoding, "cb58", "Buffer", 32);
    }
    isEmpty() {
        return this.txid.equals(buffer_1.Buffer.alloc(32));
    }
    fromBuffer(bytes, offset = 0) {
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        return offset + 32;
    }
    toBuffer() {
        return this.txid;
    }
}
exports.SerializableTxID = SerializableTxID;
class LockedIDs {
    /**
     * Class representing an [[LockedIDs]] for LockedIn and LockedOut types.
     *
     * @param depositTxID txID where this Output is deposited on
     * @param bondTxID txID where this Output is bonded on
     */
    constructor(depositTxID, bondTxID) {
        this.depositTxID = new SerializableTxID();
        this.bondTxID = new SerializableTxID();
        if (depositTxID)
            this.depositTxID.fromBuffer(depositTxID);
        if (bondTxID)
            this.bondTxID.fromBuffer(bondTxID);
    }
    serialize(encoding = "hex") {
        let lockObj = {
            depositTxID: this.depositTxID.encode(encoding),
            bondTxID: this.bondTxID.encode(encoding)
        };
        return lockObj;
    }
    deserialize(fields, encoding = "hex") {
        this.depositTxID.decode(fields["depositTxID"]);
        this.bondTxID.decode(fields["bondTxID"]);
    }
    getDepositTxID() {
        return this.depositTxID;
    }
    getBondTxID() {
        return this.bondTxID;
    }
    fromBuffer(bytes, offset = 0) {
        offset = this.depositTxID.fromBuffer(bytes, offset);
        offset = this.bondTxID.fromBuffer(bytes, offset);
        return offset;
    }
    toBuffer() {
        return buffer_1.Buffer.concat([this.depositTxID.toBuffer(), this.bondTxID.toBuffer()], 64);
    }
}
exports.LockedIDs = LockedIDs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ja2VkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9sb2NrZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQyw2REFBNkU7QUFFN0UsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRSxNQUFhLGdCQUFnQjtJQUE3QjtRQVNZLFNBQUksR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBYzNDLENBQUM7SUF0QkMsTUFBTSxDQUFDLFdBQStCLEtBQUs7UUFDekMsT0FBTyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUNyRSxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQWEsRUFBRSxXQUErQixLQUFLO1FBQ3hELElBQUksQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDMUUsQ0FBQztJQUlELE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDekQsT0FBTyxNQUFNLEdBQUcsRUFBRSxDQUFBO0lBQ3BCLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUM7Q0FDRjtBQXZCRCw0Q0F1QkM7QUFFRCxNQUFhLFNBQVM7SUFxQ3BCOzs7OztPQUtHO0lBQ0gsWUFBWSxXQUFvQixFQUFFLFFBQWlCO1FBN0J6QyxnQkFBVyxHQUFxQixJQUFJLGdCQUFnQixFQUFFLENBQUE7UUFDdEQsYUFBUSxHQUFxQixJQUFJLGdCQUFnQixFQUFFLENBQUE7UUE2QjNELElBQUksV0FBVztZQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3pELElBQUksUUFBUTtZQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ2xELENBQUM7SUE3Q0QsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxPQUFPLEdBQVc7WUFDcEIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUM5QyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ3pDLENBQUE7UUFDRCxPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDO0lBRUQsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFBO1FBQzlDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBQzFDLENBQUM7SUFLRCxjQUFjO1FBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFBO0lBQ3pCLENBQUM7SUFDRCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFBO0lBQ3RCLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1FBQ2xDLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDbkQsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNoRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxlQUFNLENBQUMsTUFBTSxDQUNsQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUN2RCxFQUFFLENBQ0gsQ0FBQTtJQUNILENBQUM7Q0FZRjtBQS9DRCw4QkErQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1Mb2NrZWRcbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcblxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG5leHBvcnQgY2xhc3MgU2VyaWFsaXphYmxlVHhJRCB7XG4gIGVuY29kZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnR4aWQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIilcbiAgfVxuXG4gIGRlY29kZSh2YWx1ZTogc3RyaW5nLCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHRoaXMudHhpZCA9IHNlcmlhbGl6YXRpb24uZGVjb2Rlcih2YWx1ZSwgZW5jb2RpbmcsIFwiY2I1OFwiLCBcIkJ1ZmZlclwiLCAzMilcbiAgfVxuXG4gIHByb3RlY3RlZCB0eGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG5cbiAgaXNFbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy50eGlkLmVxdWFscyhCdWZmZXIuYWxsb2MoMzIpKVxuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICByZXR1cm4gb2Zmc2V0ICsgMzJcbiAgfVxuXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMudHhpZFxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMb2NrZWRJRHMge1xuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBsb2NrT2JqOiBvYmplY3QgPSB7XG4gICAgICBkZXBvc2l0VHhJRDogdGhpcy5kZXBvc2l0VHhJRC5lbmNvZGUoZW5jb2RpbmcpLFxuICAgICAgYm9uZFR4SUQ6IHRoaXMuYm9uZFR4SUQuZW5jb2RlKGVuY29kaW5nKVxuICAgIH1cbiAgICByZXR1cm4gbG9ja09ialxuICB9XG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgdGhpcy5kZXBvc2l0VHhJRC5kZWNvZGUoZmllbGRzW1wiZGVwb3NpdFR4SURcIl0pXG4gICAgdGhpcy5ib25kVHhJRC5kZWNvZGUoZmllbGRzW1wiYm9uZFR4SURcIl0pXG4gIH1cblxuICBwcm90ZWN0ZWQgZGVwb3NpdFR4SUQ6IFNlcmlhbGl6YWJsZVR4SUQgPSBuZXcgU2VyaWFsaXphYmxlVHhJRCgpXG4gIHByb3RlY3RlZCBib25kVHhJRDogU2VyaWFsaXphYmxlVHhJRCA9IG5ldyBTZXJpYWxpemFibGVUeElEKClcblxuICBnZXREZXBvc2l0VHhJRCgpOiBTZXJpYWxpemFibGVUeElEIHtcbiAgICByZXR1cm4gdGhpcy5kZXBvc2l0VHhJRFxuICB9XG4gIGdldEJvbmRUeElEKCk6IFNlcmlhbGl6YWJsZVR4SUQge1xuICAgIHJldHVybiB0aGlzLmJvbmRUeElEXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHRoaXMuZGVwb3NpdFR4SUQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIG9mZnNldCA9IHRoaXMuYm9uZFR4SUQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoXG4gICAgICBbdGhpcy5kZXBvc2l0VHhJRC50b0J1ZmZlcigpLCB0aGlzLmJvbmRUeElELnRvQnVmZmVyKCldLFxuICAgICAgNjRcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIFtbTG9ja2VkSURzXV0gZm9yIExvY2tlZEluIGFuZCBMb2NrZWRPdXQgdHlwZXMuXG4gICAqXG4gICAqIEBwYXJhbSBkZXBvc2l0VHhJRCB0eElEIHdoZXJlIHRoaXMgT3V0cHV0IGlzIGRlcG9zaXRlZCBvblxuICAgKiBAcGFyYW0gYm9uZFR4SUQgdHhJRCB3aGVyZSB0aGlzIE91dHB1dCBpcyBib25kZWQgb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKGRlcG9zaXRUeElEPzogQnVmZmVyLCBib25kVHhJRD86IEJ1ZmZlcikge1xuICAgIGlmIChkZXBvc2l0VHhJRCkgdGhpcy5kZXBvc2l0VHhJRC5mcm9tQnVmZmVyKGRlcG9zaXRUeElEKVxuICAgIGlmIChib25kVHhJRCkgdGhpcy5ib25kVHhJRC5mcm9tQnVmZmVyKGJvbmRUeElEKVxuICB9XG59XG4iXX0=