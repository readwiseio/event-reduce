export const UNKNOWN_VALUE = 'UNKNOWN';
export function lastOfArray(ar) {
    return ar[ar.length - 1];
}
/**
 * @link https://stackoverflow.com/a/5915122
 */
export function randomOfArray(items) {
    return items[Math.floor(Math.random() * items.length)];
}
export function shuffleArray(arr) {
    return arr.slice().sort(() => (Math.random() - 0.5));
}
/**
 * if the previous doc-data is unknown,
 * try to get it from previous results
 * @mutate the changeEvent of input
 */
export function tryToFillPreviousDoc(input) {
    const prev = input.changeEvent.previous;
    if (prev === UNKNOWN_VALUE) {
        const id = input.changeEvent.id;
        const primary = input.queryParams.primaryKey;
        if (input.keyDocumentMap) {
            const doc = input.keyDocumentMap.get(id);
            if (doc) {
                input.changeEvent.previous = doc;
            }
        }
        else {
            const found = input.previousResults.find(item => item[primary] === id);
            if (found) {
                input.changeEvent.previous = found;
            }
        }
    }
}
/**
 * normalizes sort-field
 * in: '-age'
 * out: 'age'
 */
export function normalizeSortField(field) {
    if (field.startsWith('-')) {
        return field.substr(1);
    }
    else {
        return field;
    }
}
export function getSortFieldsOfQuery(query) {
    if (!query.sort) {
        // if no sort-order is set, use the primary key
        return ['_id'];
    }
    return query.sort.map(maybeArray => {
        if (Array.isArray(maybeArray)) {
            return maybeArray[0].map((field) => normalizeSortField(field));
        }
        else {
            return normalizeSortField(maybeArray);
        }
    });
}
/**
 *  @link https://stackoverflow.com/a/1431113
 */
export function replaceCharAt(str, index, replacement) {
    return str.substr(0, index) + replacement + str.substr(index + replacement.length);
}
export function mapToObject(map) {
    const ret = {};
    map.forEach((value, key) => {
        ret[key] = value;
    });
    return ret;
}
export function objectToMap(object) {
    const ret = new Map();
    Object.entries(object).forEach(([k, v]) => {
        ret.set(k, v);
    });
    return ret;
}
export function cloneMap(map) {
    const ret = new Map();
    map.forEach((value, key) => {
        ret[key] = value;
    });
    return ret;
}
/**
 * does a flat copy on the objects,
 * is about 3 times faster then using deepClone
 * @link https://jsperf.com/object-rest-spread-vs-clone/2
 */
export function flatClone(obj) {
    return Object.assign({}, obj);
}
export function ensureNotFalsy(obj) {
    if (!obj) {
        throw new Error('ensureNotFalsy() is falsy');
    }
    return obj;
}
export function mergeSets(sets) {
    let ret = new Set();
    sets.forEach(set => {
        ret = new Set([...ret, ...set]);
    });
    return ret;
}
/**
 * @link https://stackoverflow.com/a/12830454/3443137
 */
export function roundToTwoDecimals(num) {
    return parseFloat(num.toFixed(2));
}
export function isObject(value) {
    const type = typeof value;
    return value !== null && (type === 'object' || type === 'function');
}
export function getProperty(object, path, value) {
    if (Array.isArray(path)) {
        path = path.join('.');
    }
    if (!isObject(object) || typeof path !== 'string') {
        return value === undefined ? object : value;
    }
    const pathArray = path.split('.');
    if (pathArray.length === 0) {
        return value;
    }
    for (let index = 0; index < pathArray.length; index++) {
        const key = pathArray[index];
        if (isStringIndex(object, key)) {
            object = index === pathArray.length - 1 ? undefined : null;
        }
        else {
            object = object[key];
        }
        if (object === undefined || object === null) {
            // `object` is either `undefined` or `null` so we want to stop the loop, and
            // if this is not the last bit of the path, and
            // if it didn't return `undefined`
            // it would return `null` if `object` is `null`
            // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
            if (index !== pathArray.length - 1) {
                return value;
            }
            break;
        }
    }
    return object === undefined ? value : object;
}
function isStringIndex(object, key) {
    if (typeof key !== 'number' && Array.isArray(object)) {
        const index = Number.parseInt(key, 10);
        return Number.isInteger(index) && object[index] === object[key];
    }
    return false;
}
//# sourceMappingURL=util.js.map