import { resolveWithSimpleBdd } from 'binary-decision-diagram';
import { performanceNow } from 'async-test-util';
import { orderedStateList, stateResolveFunctions } from '../states/index.js';
import { getMinimongoCollection, minimongoUpsert, minimongoFind, getQueryParamsByMongoQuery, applyChangeEvent } from './minimongo-helper.js';
import { randomHuman } from './data-generator.js';
import { flatClone, shuffleArray } from '../util.js';
// an 'average' query
// used to measure performance
const testQuery = {
    selector: {
        gender: 'f',
        age: {
            $gt: 21,
            $lt: 80
        }
    },
    skip: 1,
    limit: 30,
    sort: [
        'name',
        'age',
        '_id'
    ]
};
/**
 * measure how much cpu each of the state functions needs
 */
export async function measurePerformanceOfStateFunctions(rounds = 1000) {
    const ret = {};
    orderedStateList.forEach(k => ret[k] = 0);
    const collection = getMinimongoCollection();
    await Promise.all(new Array(200).fill(0).map(() => minimongoUpsert(collection, randomHuman())));
    const previousResults = await minimongoFind(collection, testQuery);
    const keyDocumentMap = new Map();
    previousResults.forEach(d => keyDocumentMap.set(d._id, d));
    const addDoc = randomHuman();
    const queryParams = getQueryParamsByMongoQuery(testQuery);
    const insertStateInput = {
        queryParams,
        changeEvent: {
            operation: 'INSERT',
            doc: addDoc,
            id: addDoc._id,
            previous: null
        },
        previousResults,
        keyDocumentMap
    };
    const changedDoc = flatClone(previousResults[2]);
    changedDoc.age = 100;
    changedDoc.name = 'alice';
    const updateStateInput = {
        queryParams,
        changeEvent: {
            operation: 'UPDATE',
            doc: changedDoc,
            id: changedDoc._id,
            previous: flatClone(previousResults[2])
        },
        previousResults,
        keyDocumentMap
    };
    const deleteStateInput = {
        queryParams,
        changeEvent: {
            operation: 'DELETE',
            doc: null,
            id: previousResults[2]._id,
            previous: flatClone(previousResults[2])
        },
        previousResults,
        keyDocumentMap
    };
    let remainingRounds = rounds;
    while (remainingRounds > 0) {
        remainingRounds--;
        // do not use the same order each time
        const shuffledStateList = shuffleArray(orderedStateList);
        for (const stateName of shuffledStateList) {
            const stateFn = stateResolveFunctions[stateName];
            const startTime = performanceNow();
            stateFn(insertStateInput);
            stateFn(updateStateInput);
            stateFn(deleteStateInput);
            const endTime = performanceNow();
            const diff = endTime - startTime;
            ret[stateName] = ret[stateName] + diff;
        }
    }
    // calculate average
    orderedStateList.forEach(k => ret[k] = (ret[k] / rounds));
    return ret;
}
/**
 * Comparator used to find the best sort-order of the boolean functions.
 * In the past we just used the bdd with the least amount of nodes.
 * But not all state-functions need the same performance so we optimize
 * to use the least amount of cpu cycles
 *
 * @returns the better bdd
 */
export async function getBetterBdd(a, b, perfMeasurement, queries, procedures) {
    const qA = await getQualityOfBdd(a, perfMeasurement, queries, procedures);
    const qB = await getQualityOfBdd(b, perfMeasurement, queries, procedures);
    if (qA > qB) {
        return a;
    }
    else {
        return b;
    }
}
export async function countFunctionUsages(bdd, queries, procedures) {
    const ret = {};
    orderedStateList.forEach(stateName => ret[stateName] = 0);
    const countingResolvers = {};
    orderedStateList.forEach((stateName, index) => {
        const fn = stateResolveFunctions[stateName];
        countingResolvers[index] = (i) => {
            ret[stateName] = ret[stateName] + 1;
            return fn(i);
        };
    });
    const queryParamsByQuery = new Map();
    queries.forEach(query => {
        queryParamsByQuery.set(query, getQueryParamsByMongoQuery(query));
    });
    for (const procedure of procedures) {
        const collection = getMinimongoCollection();
        for (const changeEvent of procedure) {
            // get previous results
            const resultsBefore = new Map();
            await Promise.all(queries.map(query => {
                return minimongoFind(collection, query)
                    .then(res => resultsBefore.set(query, res));
            }));
            await applyChangeEvent(collection, changeEvent);
            for (const query of queries) {
                const params = queryParamsByQuery.get(query);
                const previousResults = resultsBefore.get(query);
                const input = {
                    changeEvent,
                    previousResults,
                    queryParams: params
                };
                const resolvedInput = resolveWithSimpleBdd(bdd.toSimpleBdd(), countingResolvers, input);
            }
        }
    }
    return ret;
}
/**
 * returns the quality of the BDD,
 * the higher the better
 */
export const QUALITY_BY_BDD_CACHE = new WeakMap();
export async function getQualityOfBdd(bdd, perfMeasurement, queries, procedures) {
    if (!QUALITY_BY_BDD_CACHE.has(bdd)) {
        const usageCount = await countFunctionUsages(bdd, queries, procedures);
        let totalTime = 0;
        Object.entries(usageCount).forEach(entry => {
            const stateName = entry[0];
            const count = entry[1];
            const price = perfMeasurement[stateName];
            const value = count * price;
            totalTime = totalTime + value;
        });
        const quality = 1000 - totalTime;
        QUALITY_BY_BDD_CACHE.set(bdd, quality);
    }
    return QUALITY_BY_BDD_CACHE.get(bdd);
}
//# sourceMappingURL=calculate-bdd-quality.js.map