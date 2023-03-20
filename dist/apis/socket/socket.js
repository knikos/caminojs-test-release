"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
class Socket extends isomorphic_ws_1.default {
    /**
     * Provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection.
     *
     * @param url Defaults to [[MainnetAPI]]
     * @param options Optional
     */
    constructor(url, options) {
        super(url, options);
    }
    /**
     * Send a message to the server
     *
     * @param data
     * @param cb Optional
     */
    send(data, cb) {
        super.send(data, cb);
    }
    /**
     * Terminates the connection completely
     *
     * @param mcode Optional
     * @param data Optional
     */
    close(mcode, data) {
        super.close(mcode, data);
    }
}
exports.Socket = Socket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvc29ja2V0L3NvY2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFLQSxrRUFBcUM7QUFDckMsTUFBYSxNQUFPLFNBQVEsdUJBQVM7SUE4Qm5DOzs7OztPQUtHO0lBQ0gsWUFDRSxHQUFXLEVBQ1gsT0FBcUQ7UUFFckQsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNyQixDQUFDO0lBL0JEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFDLElBQVMsRUFBRSxFQUFRO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3RCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxLQUFjLEVBQUUsSUFBYTtRQUNqQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMxQixDQUFDO0NBY0Y7QUExQ0Qsd0JBMENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVNvY2tldFxuICovXG5pbXBvcnQgeyBDbGllbnRSZXF1ZXN0QXJncyB9IGZyb20gXCJodHRwXCJcbmltcG9ydCBXZWJTb2NrZXQgZnJvbSBcImlzb21vcnBoaWMtd3NcIlxuZXhwb3J0IGNsYXNzIFNvY2tldCBleHRlbmRzIFdlYlNvY2tldCB7XG4gIC8vIEZpcmVzIG9uY2UgdGhlIGNvbm5lY3Rpb24gaGFzIGJlZW4gZXN0YWJsaXNoZWQgYmV0d2VlbiB0aGUgY2xpZW50IGFuZCB0aGUgc2VydmVyXG4gIG9ub3BlbjogYW55XG4gIC8vIEZpcmVzIHdoZW4gdGhlIHNlcnZlciBzZW5kcyBzb21lIGRhdGFcbiAgb25tZXNzYWdlOiBhbnlcbiAgLy8gRmlyZXMgYWZ0ZXIgZW5kIG9mIHRoZSBjb21tdW5pY2F0aW9uIGJldHdlZW4gc2VydmVyIGFuZCB0aGUgY2xpZW50XG4gIG9uY2xvc2U6IGFueVxuICAvLyBGaXJlcyBmb3Igc29tZSBtaXN0YWtlLCB3aGljaCBoYXBwZW5zIGR1cmluZyB0aGUgY29tbXVuaWNhdGlvblxuICBvbmVycm9yOiBhbnlcblxuICAvKipcbiAgICogU2VuZCBhIG1lc3NhZ2UgdG8gdGhlIHNlcnZlclxuICAgKlxuICAgKiBAcGFyYW0gZGF0YVxuICAgKiBAcGFyYW0gY2IgT3B0aW9uYWxcbiAgICovXG4gIHNlbmQoZGF0YTogYW55LCBjYj86IGFueSk6IHZvaWQge1xuICAgIHN1cGVyLnNlbmQoZGF0YSwgY2IpXG4gIH1cblxuICAvKipcbiAgICogVGVybWluYXRlcyB0aGUgY29ubmVjdGlvbiBjb21wbGV0ZWx5XG4gICAqXG4gICAqIEBwYXJhbSBtY29kZSBPcHRpb25hbFxuICAgKiBAcGFyYW0gZGF0YSBPcHRpb25hbFxuICAgKi9cbiAgY2xvc2UobWNvZGU/OiBudW1iZXIsIGRhdGE/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBzdXBlci5jbG9zZShtY29kZSwgZGF0YSlcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92aWRlcyB0aGUgQVBJIGZvciBjcmVhdGluZyBhbmQgbWFuYWdpbmcgYSBXZWJTb2NrZXQgY29ubmVjdGlvbiB0byBhIHNlcnZlciwgYXMgd2VsbCBhcyBmb3Igc2VuZGluZyBhbmQgcmVjZWl2aW5nIGRhdGEgb24gdGhlIGNvbm5lY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB1cmwgRGVmYXVsdHMgdG8gW1tNYWlubmV0QVBJXV1cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHVybDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBXZWJTb2NrZXQuQ2xpZW50T3B0aW9ucyB8IENsaWVudFJlcXVlc3RBcmdzXG4gICkge1xuICAgIHN1cGVyKHVybCwgb3B0aW9ucylcbiAgfVxufVxuIl19