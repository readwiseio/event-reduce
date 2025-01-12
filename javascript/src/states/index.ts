import { ResolverFunctions } from 'binary-decision-diagram';

import type {
    StateName,
    StateResolveFunction,
    StateSet,
    StateResolveFunctionInput
} from '../types/index.js';

import {
    hasLimit,
    isFindOne,
    hasSkip,
    wasResultsEmpty,
    isDelete,
    isInsert,
    isUpdate,
    previousUnknown,
    wasLimitReached,
    sortParamsChanged,
    wasInResult,
    wasFirst,
    wasLast,
    wasSortedBeforeFirst,
    wasSortedAfterLast,
    isSortedBeforeFirst,
    isSortedAfterLast,
    wasMatching,
    doesMatchNow
} from './state-resolver.js';

export * from './state-resolver.js';

/**
 * all states ordered by performance-cost
 * cheapest first
 * TODO run tests on which is really the fastest
 */
export const orderedStateList: StateName[] = [
    'isInsert',
    'isUpdate',
    'isDelete',
    'hasLimit',
    'isFindOne',
    'hasSkip',
    'wasResultsEmpty',
    'previousUnknown',
    'wasLimitReached',
    'wasFirst',
    'wasLast',
    'sortParamsChanged',
    'wasInResult',
    'wasSortedBeforeFirst',
    'wasSortedAfterLast',
    'isSortedBeforeFirst',
    'isSortedAfterLast',
    'wasMatching',
    'doesMatchNow'
];

export const stateResolveFunctions: {
    readonly [k in StateName]: StateResolveFunction<any>
} = {
    isInsert,
    isUpdate,
    isDelete,
    hasLimit,
    isFindOne,
    hasSkip,
    wasResultsEmpty,
    previousUnknown,
    wasLimitReached,
    wasFirst,
    wasLast,
    sortParamsChanged,
    wasInResult,
    wasSortedBeforeFirst,
    wasSortedAfterLast,
    isSortedBeforeFirst,
    isSortedAfterLast,
    wasMatching,
    doesMatchNow
};

export const stateResolveFunctionByIndex: ResolverFunctions<
    StateResolveFunctionInput<any>
> = {
    0: isInsert,
    1: isUpdate,
    2: isDelete,
    3: hasLimit,
    4: isFindOne,
    5: hasSkip,
    6: wasResultsEmpty,
    7: previousUnknown,
    8: wasLimitReached,
    9: wasFirst,
    10: wasLast,
    11: sortParamsChanged,
    12: wasInResult,
    13: wasSortedBeforeFirst,
    14: wasSortedAfterLast,
    15: isSortedBeforeFirst,
    16: isSortedAfterLast,
    17: wasMatching,
    18: doesMatchNow
};

export function resolveState<DocType>(
    stateName: StateName,
    input: StateResolveFunctionInput<DocType>
): boolean {
    const fn: StateResolveFunction<DocType> = stateResolveFunctions[stateName];
    if (!fn) {
        throw new Error('resolveState() has no function for ' + stateName);
    }
    return fn(input);
}

export function getStateSet<DocType>(
    input: StateResolveFunctionInput<DocType>
): StateSet {
    let set: StateSet = '';
    for (let i = 0; i < orderedStateList.length; i++) {
        const name: StateName = orderedStateList[i];
        const value = resolveState(name, input);
        const add = value ? '1' : '0';
        set += add;
    }
    return set;
}

export function logStateSet(stateSet: StateSet) {
    orderedStateList.forEach((state, index) => {
        console.log('state: ' + state + ' : ' + stateSet[index]);
    });
}
