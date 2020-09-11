
export const isArray = Array.isArray

export const isFunction = (val: unknown): val is Function => typeof val === 'function'

export const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean'

export const isString = (val: unknown): val is string => typeof val === 'string'
export const isNumber = (val: unknown): val is number => typeof val === 'number'

export const isUndefined = (val: unknown): val is undefined => typeof val === "undefined"

export const isNull = (val: unknown): val is Record<any, any> => val === null && typeof val === 'object'

export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object' && !isArray(val)

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
    return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export const objLen = (val: any): number => isObject(val) ? Object.keys(val).length : 0

export const UID = (num = 16) => Math.floor(Math.random() * Math.pow(10, num))