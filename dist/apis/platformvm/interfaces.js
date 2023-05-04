"use strict";
/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vaW50ZXJmYWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgUGxhdGZvcm1WTS1JbnRlcmZhY2VzXG4gKi9cblxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgeyBQZXJzaXN0YW5jZU9wdGlvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcGVyc2lzdGVuY2VvcHRpb25zXCJcbmltcG9ydCB7IENsYWltVHlwZSwgVHJhbnNmZXJhYmxlSW5wdXQsIFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuXCJcbmltcG9ydCB7IFVUWE9TZXQgfSBmcm9tIFwiLi91dHhvc1wiXG5pbXBvcnQgeyBPdXRwdXRPd25lcnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL291dHB1dFwiXG5cbmV4cG9ydCBpbnRlcmZhY2UgQWRkcmVzc1BhcmFtcyB7XG4gIGFkZHJlc3M6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldFN0YWtlUGFyYW1zIHtcbiAgYWRkcmVzc2VzOiBzdHJpbmdbXVxuICBlbmNvZGluZzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0U3Rha2VSZXNwb25zZSB7XG4gIHN0YWtlZDogQk5cbiAgc3Rha2VkT3V0cHV0czogVHJhbnNmZXJhYmxlT3V0cHV0W11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRSZXdhcmRVVFhPc1BhcmFtcyB7XG4gIHR4SUQ6IHN0cmluZ1xuICBlbmNvZGluZzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0UmV3YXJkVVRYT3NSZXNwb25zZSB7XG4gIG51bUZldGNoZWQ6IG51bWJlclxuICB1dHhvczogc3RyaW5nW11cbiAgZW5jb2Rpbmc6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldFZhbGlkYXRvcnNBdFBhcmFtcyB7XG4gIGhlaWdodDogbnVtYmVyXG4gIHN1Ym5ldElEPzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0VmFsaWRhdG9yc0F0UmVzcG9uc2Uge1xuICB2YWxpZGF0b3JzOiBvYmplY3Rcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRDb25maWd1cmF0aW9uUmVzcG9uc2Uge1xuICBuZXR3b3JrSUQ6IG51bWJlclxuICBhc3NldElEOiBzdHJpbmdcbiAgYXNzZXRTeW1ib2w6IHN0cmluZ1xuICBocnA6IHN0cmluZ1xuICBibG9ja2NoYWluczogb2JqZWN0W11cbiAgbWluU3Rha2VEdXJhdGlvbjogbnVtYmVyXG4gIG1heFN0YWtlRHVyYXRpb246IG51bWJlclxuICBtaW5WYWxpZGF0b3JTdGFrZTogQk5cbiAgbWF4VmFsaWRhdG9yU3Rha2U6IEJOXG4gIG1pbkRlbGVnYXRpb25GZWU6IEJOXG4gIG1pbkRlbGVnYXRvclN0YWtlOiBCTlxuICBtaW5Db25zdW1wdGlvblJhdGU6IG51bWJlclxuICBtYXhDb25zdW1wdGlvblJhdGU6IG51bWJlclxuICBzdXBwbHlDYXA6IEJOXG4gIHZlcmlmeU5vZGVTaWduYXR1cmU6IGJvb2xlYW5cbiAgbG9ja01vZGVCb25kRGVwb3NpdDogYm9vbGVhblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldEN1cnJlbnRWYWxpZGF0b3JzUGFyYW1zIHtcbiAgc3VibmV0SUQ/OiBCdWZmZXIgfCBzdHJpbmdcbiAgbm9kZUlEcz86IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0QWxsRGVwb3NpdE9mZmVyc1BhcmFtcyB7XG4gIHRpbWVzdGFtcDogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FtcGxlVmFsaWRhdG9yc1BhcmFtcyB7XG4gIHNpemU6IG51bWJlciB8IHN0cmluZ1xuICBzdWJuZXRJRD86IEJ1ZmZlciB8IHN0cmluZyB8IHVuZGVmaW5lZFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNhbXBsZVZhbGlkYXRvcnNQYXJhbXMge1xuICBzaXplOiBudW1iZXIgfCBzdHJpbmdcbiAgc3VibmV0SUQ/OiBCdWZmZXIgfCBzdHJpbmcgfCB1bmRlZmluZWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZGRWYWxpZGF0b3JQYXJhbXMge1xuICB1c2VybmFtZTogc3RyaW5nXG4gIHBhc3N3b3JkOiBzdHJpbmdcbiAgbm9kZUlEOiBzdHJpbmdcbiAgc3RhcnRUaW1lOiBudW1iZXJcbiAgZW5kVGltZTogbnVtYmVyXG4gIHN0YWtlQW1vdW50OiBzdHJpbmdcbiAgcmV3YXJkQWRkcmVzczogc3RyaW5nXG4gIGRlbGVnYXRpb25GZWVSYXRlPzogc3RyaW5nIHwgdW5kZWZpbmVkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWRkRGVsZWdhdG9yUGFyYW1zIHtcbiAgdXNlcm5hbWU6IHN0cmluZ1xuICBwYXNzd29yZDogc3RyaW5nXG4gIG5vZGVJRDogc3RyaW5nXG4gIHN0YXJ0VGltZTogbnVtYmVyXG4gIGVuZFRpbWU6IG51bWJlclxuICBzdGFrZUFtb3VudDogc3RyaW5nXG4gIHJld2FyZEFkZHJlc3M6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldFBlbmRpbmdWYWxpZGF0b3JzUGFyYW1zIHtcbiAgc3VibmV0SUQ/OiBCdWZmZXIgfCBzdHJpbmdcbiAgbm9kZUlEcz86IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwb3J0QVZBWFBhcmFtcyB7XG4gIHVzZXJuYW1lOiBzdHJpbmdcbiAgcGFzc3dvcmQ6IHN0cmluZ1xuICBhbW91bnQ6IHN0cmluZ1xuICB0bzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1wb3J0QVZBWFBhcmFtcyB7XG4gIHVzZXJuYW1lOiBzdHJpbmdcbiAgcGFzc3dvcmQ6IHN0cmluZ1xuICBzb3VyY2VDaGFpbjogc3RyaW5nXG4gIHRvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHBvcnRLZXlQYXJhbXMge1xuICB1c2VybmFtZTogc3RyaW5nXG4gIHBhc3N3b3JkOiBzdHJpbmdcbiAgYWRkcmVzczogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1wb3J0S2V5UGFyYW1zIHtcbiAgdXNlcm5hbWU6IHN0cmluZ1xuICBwYXNzd29yZDogc3RyaW5nXG4gIHByaXZhdGVLZXk6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVUWE9JRCB7XG4gIHR4SUQ6IHN0cmluZ1xuICBvdXRwdXRJbmRleDogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFsYW5jZURpY3Qge1xuICBbYXNzZXRJZDogc3RyaW5nXTogQk5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRCYWxhbmNlUmVzcG9uc2VBdmF4IHtcbiAgYmFsYW5jZTogQk5cbiAgdW5sb2NrZWQ6IEJOXG4gIGxvY2tlZFN0YWtlYWJsZTogQk5cbiAgbG9ja2VkTm90U3Rha2VhYmxlOiBCTlxuICB1dHhvSURzOiBVVFhPSURbXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldEJhbGFuY2VSZXNwb25zZUNhbWlubyB7XG4gIGJhbGFuY2VzOiBCYWxhbmNlRGljdFxuICB1bmxvY2tlZE91dHB1dHM6IEJhbGFuY2VEaWN0XG4gIGJvbmRlZE91dHB1dHM6IEJhbGFuY2VEaWN0XG4gIGRlcG9zaXRlZE91dHB1dHM6IEJhbGFuY2VEaWN0XG4gIGJvbmRlZERlcG9zaXRlZE91dHB1dHM6IEJhbGFuY2VEaWN0XG4gIHV0eG9JRHM6IFVUWE9JRFtdXG59XG5cbmV4cG9ydCB0eXBlIEdldEJhbGFuY2VSZXNwb25zZSA9XG4gIHwgR2V0QmFsYW5jZVJlc3BvbnNlQXZheFxuICB8IEdldEJhbGFuY2VSZXNwb25zZUNhbWlub1xuXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUFkZHJlc3NQYXJhbXMge1xuICB1c2VybmFtZTogc3RyaW5nXG4gIHBhc3N3b3JkOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0QWRkcmVzc2VzUGFyYW1zIHtcbiAgdXNlcm5hbWU6IHN0cmluZ1xuICBwYXNzd29yZDogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RhcnRJbmRleCB7XG4gIGFkZHJlc3M6IHN0cmluZ1xuICB1dHhvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRVVFhPc1BhcmFtcyB7XG4gIGFkZHJlc3Nlczogc3RyaW5nW10gfCBzdHJpbmdcbiAgc291cmNlQ2hhaW4/OiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgbGltaXQ6IG51bWJlciB8IDBcbiAgc3RhcnRJbmRleD86IFN0YXJ0SW5kZXggfCB1bmRlZmluZWRcbiAgcGVyc2lzdE9wdHM/OiBQZXJzaXN0YW5jZU9wdGlvbnMgfCB1bmRlZmluZWRcbiAgZW5jb2Rpbmc/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbmRJbmRleCB7XG4gIGFkZHJlc3M6IHN0cmluZ1xuICB1dHhvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRVVFhPc1Jlc3BvbnNlIHtcbiAgbnVtRmV0Y2hlZDogbnVtYmVyXG4gIHV0eG9zOiBVVFhPU2V0XG4gIGVuZEluZGV4OiBFbmRJbmRleFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZVN1Ym5ldFBhcmFtcyB7XG4gIHVzZXJuYW1lOiBzdHJpbmdcbiAgcGFzc3dvcmQ6IHN0cmluZ1xuICBjb250cm9sS2V5czogc3RyaW5nW11cbiAgdGhyZXNob2xkOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJuZXQge1xuICBpZHM6IHN0cmluZ1xuICBjb250cm9sS2V5czogc3RyaW5nW11cbiAgdGhyZXNob2xkOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVCbG9ja2NoYWluUGFyYW1zIHtcbiAgdXNlcm5hbWU6IHN0cmluZ1xuICBwYXNzd29yZDogc3RyaW5nXG4gIHN1Ym5ldElEPzogQnVmZmVyIHwgc3RyaW5nIHwgdW5kZWZpbmVkXG4gIHZtSUQ6IHN0cmluZ1xuICBmeElEczogbnVtYmVyW11cbiAgbmFtZTogc3RyaW5nXG4gIGdlbmVzaXNEYXRhOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCbG9ja2NoYWluIHtcbiAgaWQ6IHN0cmluZ1xuICBuYW1lOiBzdHJpbmdcbiAgc3VibmV0SUQ6IHN0cmluZ1xuICB2bUlEOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRUeFN0YXR1c1BhcmFtcyB7XG4gIHR4SUQ6IHN0cmluZ1xuICBpbmNsdWRlUmVhc29uPzogYm9vbGVhbiB8IHRydWVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRUeFN0YXR1c1Jlc3BvbnNlIHtcbiAgc3RhdHVzOiBzdHJpbmdcbiAgcmVhc29uOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRNaW5TdGFrZVJlc3BvbnNlIHtcbiAgbWluVmFsaWRhdG9yU3Rha2U6IEJOXG4gIG1pbkRlbGVnYXRvclN0YWtlOiBCTlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENsYWltYWJsZSB7XG4gIHJld2FyZE93bmVyPzogT3duZXJcbiAgdmFsaWRhdG9yUmV3YXJkczogQk5cbiAgZXhwaXJlZERlcG9zaXRSZXdhcmRzOiBCTlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldENsYWltYWJsZXNSZXNwb25zZSB7XG4gIGNsYWltYWJsZXM6IENsYWltYWJsZVtdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0QWxsRGVwb3NpdE9mZmVyc1Jlc3BvbnNlIHtcbiAgZGVwb3NpdE9mZmVyczogRGVwb3NpdE9mZmVyW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZXBvc2l0T2ZmZXIge1xuICBpZDogc3RyaW5nXG4gIGludGVyZXN0UmF0ZU5vbWluYXRvcjogQk5cbiAgc3RhcnQ6IEJOXG4gIGVuZDogQk5cbiAgbWluQW1vdW50OiBCTlxuICBtaW5EdXJhdGlvbjogbnVtYmVyXG4gIG1heER1cmF0aW9uOiBudW1iZXJcbiAgdW5sb2NrUGVyaW9kRHVyYXRpb246IG51bWJlclxuICBub1Jld2FyZHNQZXJpb2REdXJhdGlvbjogbnVtYmVyXG4gIG1lbW86IHN0cmluZ1xuICBmbGFnczogQk5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXREZXBvc2l0c1BhcmFtcyB7XG4gIGRlcG9zaXRUeElEczogc3RyaW5nW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXREZXBvc2l0c1Jlc3BvbnNlIHtcbiAgZGVwb3NpdHM6IEFQSURlcG9zaXRbXVxuICBhdmFpbGFibGVSZXdhcmRzOiBCTltdXG4gIHRpbWVzdGFtcDogQk5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBBUElEZXBvc2l0IHtcbiAgZGVwb3NpdFR4SUQ6IHN0cmluZ1xuICBkZXBvc2l0T2ZmZXJJRDogc3RyaW5nXG4gIHVubG9ja2VkQW1vdW50OiBCTlxuICBjbGFpbWVkUmV3YXJkQW1vdW50OiBCTlxuICBzdGFydDogQk5cbiAgZHVyYXRpb246IG51bWJlclxuICBhbW91bnQ6IEJOXG4gIHJld2FyZE93bmVyOiBPd25lclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldE1heFN0YWtlQW1vdW50UGFyYW1zIHtcbiAgc3VibmV0SUQ/OiBzdHJpbmdcbiAgbm9kZUlEOiBzdHJpbmdcbiAgc3RhcnRUaW1lOiBzdHJpbmdcbiAgZW5kVGltZTogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3duZXIge1xuICBsb2NrdGltZTogQk5cbiAgdGhyZXNob2xkOiBudW1iZXJcbiAgYWRkcmVzc2VzOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE93bmVyUGFyYW0ge1xuICBsb2NrdGltZTogc3RyaW5nXG4gIHRocmVzaG9sZDogbnVtYmVyXG4gIGFkZHJlc3Nlczogc3RyaW5nW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNdWx0aXNpZ0FsaWFzUmVwbHkgZXh0ZW5kcyBPd25lciB7XG4gIG1lbW86IHN0cmluZyAvLyBoZXggZW5jb2RlZCBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTcGVuZFBhcmFtcyB7XG4gIGZyb206IHN0cmluZ1tdIHwgc3RyaW5nXG4gIHNpZ25lcjogc3RyaW5nW10gfCBzdHJpbmdcbiAgdG8/OiBPd25lclBhcmFtXG4gIGNoYW5nZT86IE93bmVyUGFyYW1cblxuICBsb2NrTW9kZTogMCB8IDEgfCAyXG4gIGFtb3VudFRvTG9jazogc3RyaW5nXG4gIGFtb3VudFRvQnVybjogc3RyaW5nXG4gIGFzT2Y6IHN0cmluZ1xuICBlbmNvZGluZz86IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNwZW5kUmVwbHkge1xuICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W11cbiAgb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXRbXVxuICBvd25lcnM6IE91dHB1dE93bmVyc1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhaW1BbW91bnRQYXJhbXMge1xuICBpZD86IEJ1ZmZlclxuICBjbGFpbVR5cGU6IENsYWltVHlwZVxuICBhbW91bnQ6IEJOXG4gIG93bmVyczogT3V0cHV0T3duZXJzXG4gIHNpZ0lkeHM6IG51bWJlcltdXG59XG4iXX0=