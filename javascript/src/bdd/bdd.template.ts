import {
    SimpleBdd,
    minimalStringToSimpleBdd,
    resolveWithSimpleBdd
} from 'binary-decision-diagram';

import type { StateResolveFunctionInput } from '../types';
import { stateResolveFunctionByIndex } from '../states';

export const minimalBddString = '${minimalBddString}';

let simpleBdd: SimpleBdd | undefined;
export function getSimpleBdd() {
    if (!simpleBdd) {
        simpleBdd = minimalStringToSimpleBdd(minimalBddString);
    }
    return simpleBdd;
}

export const resolveInput = (input: StateResolveFunctionInput<any>) => {
    return resolveWithSimpleBdd(
        getSimpleBdd(),
        stateResolveFunctionByIndex,
        input
    );
};
