"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UID = exports.objLen = exports.isPromise = exports.isObject = exports.isSymbol = exports.isNull = exports.isUndefined = exports.isNumber = exports.isString = exports.isBoolean = exports.isFunction = exports.isArray = void 0;
exports.isArray = Array.isArray;
exports.isFunction = (val) => typeof val === 'function';
exports.isBoolean = (val) => typeof val === 'boolean';
exports.isString = (val) => typeof val === 'string';
exports.isNumber = (val) => typeof val === 'number';
exports.isUndefined = (val) => typeof val === "undefined";
exports.isNull = (val) => val === null && typeof val === 'object';
exports.isSymbol = (val) => typeof val === 'symbol';
exports.isObject = (val) => val !== null && typeof val === 'object' && !exports.isArray(val);
exports.isPromise = (val) => {
    return exports.isObject(val) && exports.isFunction(val.then) && exports.isFunction(val.catch);
};
exports.objLen = (val) => exports.isObject(val) ? Object.keys(val).length : 0;
exports.UID = (num = 16) => Math.floor(Math.random() * Math.pow(10, num));
