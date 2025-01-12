"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestProcedures = exports.sortParamChanged = exports.oneThatWasCrashing = exports.insertFiveSortedThenRemoveSorted = exports.insertFiveSorted = exports.insertFiveThenChangeAgeOfOne = exports.insertChangeAndCleanup = void 0;
const faker_1 = require("@faker-js/faker");
const data_generator_js_1 = require("./data-generator.js");
const config_js_1 = require("./config.js");
const minimongo_helper_js_1 = require("./minimongo-helper.js");
const util_js_1 = require("../util.js");
function insertChangeAndCleanup(unknownPrevious = false) {
    const ret = [];
    let docs = [];
    (0, data_generator_js_1.randomHumans)(5).forEach(h => {
        const insertEvent = {
            operation: 'INSERT',
            doc: h,
            previous: null,
            id: h._id
        };
        docs.push(h);
        ret.push(insertEvent);
        // do a random update
        const updateDoc = faker_1.faker.helpers.arrayElement(docs);
        const after = (0, data_generator_js_1.randomChangeHuman)(updateDoc);
        docs = docs.filter(d => d._id !== updateDoc._id);
        docs.push(after);
        const updateEvent = {
            operation: 'UPDATE',
            doc: after,
            previous: updateDoc,
            id: after._id
        };
        ret.push(updateEvent);
    });
    // update all to big age
    const shuffled = faker_1.faker.helpers.shuffle(docs);
    while (shuffled.length > 0) {
        const changeMe = shuffled.pop();
        const changeMeAfter = (0, data_generator_js_1.randomChangeHuman)(changeMe);
        docs = docs.filter(d => d._id !== changeMe._id);
        docs.push(changeMeAfter);
        changeMeAfter.age = 1000 + faker_1.faker.number.int({
            min: 10,
            max: 100
        });
        const updateEvent = {
            operation: 'UPDATE',
            doc: changeMeAfter,
            previous: changeMe,
            id: changeMeAfter._id
        };
        ret.push(updateEvent);
    }
    // cleanup
    const shuffled2 = faker_1.faker.helpers.shuffle(docs);
    while (shuffled2.length > 0) {
        const deleteMe = shuffled2.pop();
        const deleteEvent = {
            operation: 'DELETE',
            doc: null,
            previous: deleteMe,
            id: deleteMe._id
        };
        ret.push(deleteEvent);
    }
    if (unknownPrevious) {
        ret
            .filter(ev => ev.previous)
            .forEach(ev => ev.previous = config_js_1.UNKNOWN_VALUE);
    }
    return ret;
}
exports.insertChangeAndCleanup = insertChangeAndCleanup;
function insertFiveThenChangeAgeOfOne() {
    const humans = (0, data_generator_js_1.randomHumans)(5).sort((0, minimongo_helper_js_1.compileSort)(['age']));
    const ret = humans.map(human => {
        const changeEvent = {
            operation: 'INSERT',
            id: human._id,
            doc: human,
            previous: null
        };
        return changeEvent;
    });
    const prevDoc = humans[3];
    const changedDoc = (0, util_js_1.flatClone)(prevDoc);
    changedDoc.age = 0;
    const updateEvent = {
        operation: 'UPDATE',
        id: prevDoc._id,
        doc: changedDoc,
        previous: prevDoc
    };
    ret.push(updateEvent);
    const deleteDoc = (0, util_js_1.flatClone)(changedDoc);
    const deleteEvent = {
        operation: 'DELETE',
        id: deleteDoc._id,
        doc: null,
        previous: deleteDoc
    };
    ret.push(deleteEvent);
    return ret;
}
exports.insertFiveThenChangeAgeOfOne = insertFiveThenChangeAgeOfOne;
function insertFiveSorted() {
    return [
        {
            operation: 'INSERT',
            id: '1',
            doc: {
                _id: '1',
                name: 'jessy1',
                gender: 'f',
                age: 1
            },
            previous: null
        },
        {
            operation: 'INSERT',
            id: '2',
            doc: {
                _id: '2',
                name: 'jessy2',
                gender: 'f',
                age: 2
            },
            previous: null
        },
        {
            operation: 'INSERT',
            id: '3',
            doc: {
                _id: '3',
                name: 'jessy3',
                gender: 'f',
                age: 3
            },
            previous: null
        },
        {
            operation: 'INSERT',
            id: '4',
            doc: {
                _id: '4',
                name: 'jessy4',
                gender: 'f',
                age: 4
            },
            previous: null
        }, {
            operation: 'INSERT',
            id: '5',
            doc: {
                _id: '5',
                name: 'jessy5',
                gender: 'f',
                age: 5
            },
            previous: null
        }
    ];
}
exports.insertFiveSorted = insertFiveSorted;
function insertFiveSortedThenRemoveSorted() {
    const inserts = insertFiveSorted();
    const ret = inserts.slice();
    inserts.forEach(cE => {
        const doc = (0, util_js_1.flatClone)((0, util_js_1.ensureNotFalsy)(cE.doc));
        ret.push({
            operation: 'DELETE',
            doc: null,
            id: doc._id,
            previous: doc
        });
    });
    return ret;
}
exports.insertFiveSortedThenRemoveSorted = insertFiveSortedThenRemoveSorted;
function oneThatWasCrashing() {
    return [
        {
            operation: 'INSERT',
            doc: { _id: '7u3de00tms', name: 'maye', gender: 'f', age: 78 },
            previous: null,
            id: '7u3de00tms'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '7u3de00tms', name: 'maye', gender: 'f', age: 78 },
            previous: { _id: '7u3de00tms', name: 'maye', gender: 'f', age: 78 },
            id: '7u3de00tms'
        },
        {
            operation: 'INSERT',
            doc: { _id: '3184gyi5e4', name: 'joel', gender: 'f', age: 91 },
            previous: null,
            id: '3184gyi5e4'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '7u3de00tms', name: 'toby', gender: 'f', age: 78 },
            previous: { _id: '7u3de00tms', name: 'maye', gender: 'f', age: 78 },
            id: '7u3de00tms'
        },
        {
            operation: 'INSERT',
            doc: { _id: '4im72wg9ev', name: 'sadie', gender: 'f', age: 72 },
            previous: null,
            id: '4im72wg9ev'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '3184gyi5e4', name: 'john', gender: 'f', age: 91 },
            previous: { _id: '3184gyi5e4', name: 'joel', gender: 'f', age: 91 },
            id: '3184gyi5e4'
        },
        {
            operation: 'INSERT',
            doc: { _id: '0swab77ah3', name: 'salma', gender: 'm', age: 35 },
            previous: null,
            id: '0swab77ah3'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '0swab77ah3', name: 'salma', gender: 'm', age: 48 },
            previous: { _id: '0swab77ah3', name: 'salma', gender: 'm', age: 35 },
            id: '0swab77ah3'
        },
        {
            operation: 'INSERT',
            doc: { _id: '12ypzlmfgd', name: 'josie', gender: 'm', age: 35 },
            previous: null,
            id: '12ypzlmfgd'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '4im72wg9ev', name: 'kitty', gender: 'f', age: 72 },
            previous: { _id: '4im72wg9ev', name: 'sadie', gender: 'f', age: 72 },
            id: '4im72wg9ev'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '4im72wg9ev', name: 'kitty', gender: 'f', age: 1035 },
            previous: { _id: '4im72wg9ev', name: 'kitty', gender: 'f', age: 72 },
            id: '4im72wg9ev'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '0swab77ah3', name: 'sage', gender: 'm', age: 1017 },
            previous: { _id: '0swab77ah3', name: 'salma', gender: 'm', age: 48 },
            id: '0swab77ah3'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '12ypzlmfgd', name: 'josie', gender: 'm', age: 1083 },
            previous: { _id: '12ypzlmfgd', name: 'josie', gender: 'm', age: 35 },
            id: '12ypzlmfgd'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '3184gyi5e4', name: 'rosella', gender: 'f', age: 1080 },
            previous: { _id: '3184gyi5e4', name: 'john', gender: 'f', age: 91 },
            id: '3184gyi5e4'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '7u3de00tms', name: 'toby', gender: 'f', age: 1100 },
            previous: { _id: '7u3de00tms', name: 'toby', gender: 'f', age: 78 },
            id: '7u3de00tms'
        },
        {
            operation: 'DELETE',
            doc: null,
            previous: { _id: '7u3de00tms', name: 'toby', gender: 'f', age: 1100 },
            id: '7u3de00tms'
        },
        {
            operation: 'DELETE',
            doc: null,
            previous: { _id: '3184gyi5e4', name: 'rosella', gender: 'f', age: 1080 },
            id: '3184gyi5e4'
        },
        {
            operation: 'DELETE',
            doc: null,
            previous: { _id: '0swab77ah3', name: 'sage', gender: 'm', age: 1017 },
            id: '0swab77ah3'
        },
        {
            operation: 'DELETE',
            doc: null,
            previous: { _id: '12ypzlmfgd', name: 'josie', gender: 'm', age: 1083 },
            id: '12ypzlmfgd'
        },
        {
            operation: 'DELETE',
            doc: null,
            previous: { _id: '4im72wg9ev', name: 'kitty', gender: 'f', age: 1035 },
            id: '4im72wg9ev'
        }
    ];
}
exports.oneThatWasCrashing = oneThatWasCrashing;
function sortParamChanged() {
    return [
        {
            operation: 'INSERT',
            doc: { _id: '6eu7byz49iq9', name: 'Eugenia', gender: 'f', age: 16 },
            previous: null,
            id: '6eu7byz49iq9'
        },
        {
            operation: 'INSERT',
            doc: { _id: 's90j6hhznefj', name: 'Freeman', gender: 'f', age: 25 },
            previous: null,
            id: 's90j6hhznefj'
        },
        {
            operation: 'UPDATE',
            doc: { _id: '6eu7byz49iq9', name: 'Eugenia', gender: 'f', age: 50 },
            previous: { _id: '6eu7byz49iq9', name: 'Eugenia', gender: 'f', age: 16 },
            id: '6eu7byz49iq9'
        }
    ];
}
exports.sortParamChanged = sortParamChanged;
let CACHE;
function getTestProcedures() {
    if (!CACHE) {
        const ret = [];
        ret.push(insertChangeAndCleanup());
        ret.push(insertChangeAndCleanup(true));
        ret.push(insertFiveThenChangeAgeOfOne());
        ret.push(insertFiveSortedThenRemoveSorted());
        ret.push(oneThatWasCrashing());
        ret.push(sortParamChanged());
        CACHE = ret;
    }
    return CACHE;
}
exports.getTestProcedures = getTestProcedures;
//# sourceMappingURL=procedures.js.map