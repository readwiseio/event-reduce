import deepEqual from 'deep-equal';
import { getMinimongoCollection, minimongoFind, applyChangeEvent, getQueryParamsByMongoQuery } from './minimongo-helper.js';
import { runAction } from '../index.js';
import { orderedActionList } from '../actions/index.js';
import { getStateSet } from '../states/index.js';
export async function generateTruthTable({ queries, procedures, table = new Map(), log = false }) {
    let done = false;
    while (!done) {
        let totalChanges = 0;
        for (const procedure of procedures) {
            if (log) {
                console.log('generateTruthTable() next procedure with ' + procedure.length + ' events');
            }
            const changes = await incrementTruthTableActions(table, queries, procedure, log);
            totalChanges = totalChanges + changes;
        }
        if (totalChanges === 0) {
            done = true;
        }
    }
    return table;
}
export async function incrementTruthTableActions(table = new Map(), queries, procedure, log = false) {
    if (log) {
        console.log('incrementTruthTableActions()');
    }
    let changesCount = 0;
    const queryParamsByQuery = new Map();
    queries.forEach(async (query) => {
        queryParamsByQuery.set(query, getQueryParamsByMongoQuery(query));
    });
    const resultsBefore = new Map();
    queries.forEach(async (query) => {
        resultsBefore.set(query, []);
    });
    const collection = getMinimongoCollection();
    for (const changeEvent of procedure) {
        await applyChangeEvent(collection, changeEvent);
        // find action to generate after results
        for (const query of queries) {
            const params = queryParamsByQuery.get(query);
            const before = resultsBefore.get(query);
            const after = await minimongoFind(collection, query);
            const input = {
                changeEvent,
                previousResults: before.slice(),
                queryParams: params
            };
            const state = getStateSet(input);
            if (state === '10000000011000000') {
                console.log('!!');
                process.exit();
            }
            let currentActionId = table.get(state);
            if (!currentActionId) {
                table.set(state, 0);
                currentActionId = 0;
            }
            const nextWorking = getNextWorkingAction(input, after, currentActionId);
            resultsBefore.set(query, after);
            if (nextWorking !== currentActionId) {
                table.set(state, nextWorking);
                changesCount++;
                if (log) {
                    console.log('nextWorking() ' + state + ' - from ' +
                        orderedActionList[currentActionId] +
                        ' to ' + orderedActionList[nextWorking]);
                }
            }
        }
    }
    return changesCount;
}
export function getNextWorkingAction(input, resultAfter, lastWorkingActionId, log = false) {
    let t = lastWorkingActionId;
    while (t <= orderedActionList.length) {
        const actionName = orderedActionList[t];
        const doesWork = doesActionWork(input, resultAfter, actionName, log);
        // console.log(actionName + ' :: ' + doesWork);
        if (doesWork) {
            if (actionName === 'alwaysWrong') {
                throw new Error('action alwaysWrong cannot be true');
            }
            return t;
        }
        t++;
    }
    throw new Error('this should never happen');
}
/**
 * returns true if the action calculates the same
 * results as given
 */
export function doesActionWork(input, resultAfter, actionName, log = false) {
    if (actionName === 'runFullQueryAgain') {
        return true;
    }
    /*
    console.log('--- '.repeat(100));
    console.dir(input);
    console.dir(input.previousResults);
    console.dir(resultAfter);*/
    const calculatedResults = runAction(actionName, input.queryParams, input.changeEvent, input.previousResults.slice());
    // console.dir(calculatedResults);
    if (
    // optimisation shortcut, this is faster because we know we have two arrays
    calculatedResults.length === resultAfter.length &&
        deepEqual(calculatedResults, resultAfter)) {
        return true;
    }
    else {
        return false;
    }
}
//# sourceMappingURL=index.js.map