"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessException = void 0;
class BusinessException extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'BusinessException';
    }
}
exports.BusinessException = BusinessException;
//# sourceMappingURL=business.exception.js.map