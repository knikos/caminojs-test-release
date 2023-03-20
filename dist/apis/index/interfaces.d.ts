/**
 * @packageDocumentation
 * @module Index-Interfaces
 */
export interface BaseIndexParams {
    encoding: string;
}
export interface BaseIndexResponse {
    id: string;
    bytes: string;
    timestamp: string;
    encoding: string;
    index: string;
}
export declare type GetLastAcceptedParams = BaseIndexParams;
export declare type GetLastAcceptedResponse = BaseIndexResponse;
export declare type GetLastVertexParams = BaseIndexParams;
export declare type GetLastVertexResponse = BaseIndexResponse;
export interface GetContainerByIndexParams extends BaseIndexParams {
    index: string;
}
export declare type GetContainerByIndexResponse = BaseIndexResponse;
export interface GetContainerByIDParams extends BaseIndexParams {
    id: string;
}
export declare type GetContainerByIDResponse = BaseIndexResponse;
export interface GetContainerRangeParams extends BaseIndexParams {
    startIndex: number;
    numToFetch: number;
}
export interface IsAcceptedResponse {
    isAccepted: boolean;
}
export interface GetContainerRangeResponse {
    constainer: BaseIndexParams[];
}
export interface GetIndexParams extends BaseIndexParams {
    id: string;
}
export interface GetIsAcceptedParams extends BaseIndexParams {
    id: string;
}
//# sourceMappingURL=interfaces.d.ts.map