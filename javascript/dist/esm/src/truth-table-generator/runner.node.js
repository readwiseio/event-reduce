import * as fs from 'fs';
import { faker } from '@faker-js/faker';
import { createBddFromTruthTable, bddToMinimalString, fillTruthTable, optimizeBruteForce } from 'binary-decision-diagram';
import { OUTPUT_FOLDER_PATH, OUTPUT_TRUTH_TABLE_PATH } from './config.js';
import { getQueryVariations } from './queries.js';
import { getTestProcedures } from './procedures.js';
import { generateTruthTable } from './index.js';
import { mapToObject, objectToMap, roundToTwoDecimals } from '../util.js';
import { readJsonFile, writeJsonFile } from './util.js';
import { fuzzing } from './fuzzing.js';
import { writeBddTemplate } from '../bdd/write-bdd-template.js';
import { measurePerformanceOfStateFunctions, getBetterBdd, QUALITY_BY_BDD_CACHE } from './calculate-bdd-quality.js';
/**
 * sort object attributes
 * @link https://stackoverflow.com/a/39442287
 */
export function sortObject(obj) {
    return Object
        .entries(obj)
        .sort()
        .reduce((_sortedObj, [k, v]) => ({
        ..._sortedObj,
        [k]: v
    }), {});
}
const unknownValueActionId = 42;
async function run() {
    if (!fs.existsSync(OUTPUT_FOLDER_PATH)) {
        fs.mkdirSync(OUTPUT_FOLDER_PATH);
    }
    const args = process.argv;
    const command = args[2];
    console.log('run command: ' + command);
    console.log(__filename);
    switch (command) {
        case 'generate-truth-table':
            (async function generate() {
                const queries = getQueryVariations();
                const procedures = getTestProcedures();
                const table = await generateTruthTable({
                    queries,
                    procedures,
                    log: true
                });
                console.dir(table);
                const tableObject = mapToObject(table);
                writeJsonFile(OUTPUT_TRUTH_TABLE_PATH, tableObject);
            })();
            break;
        case 'fuzzing':
            (async function fuzz() {
                const truthTable = objectToMap(readJsonFile(OUTPUT_TRUTH_TABLE_PATH));
                const result = await fuzzing(truthTable, 20, // queries
                20 // events
                );
                console.dir(result);
            })();
            break;
        /**
         * runs the fuzzing and each time a non-working set is found,
         * generate the table again
         */
        case 'iterative-fuzzing':
            (async function iterativeFuzzing() {
                let lastErrorFoundTime = new Date().getTime();
                /**
                 * Reset the random seed!
                 * When we restart the generating processes,
                 * we do not want up to run with the same dataset again.
                 */
                faker.seed(new Date().getTime());
                const truthTable = objectToMap(readJsonFile(OUTPUT_TRUTH_TABLE_PATH));
                const queries = getQueryVariations();
                const procedures = getTestProcedures();
                let totalAmountOfHandled = 0;
                let totalAmountOfOptimized = 0;
                while (true) {
                    let fuzzingFoundError = false;
                    let fuzzingCount = 0;
                    while (!fuzzingFoundError) {
                        fuzzingCount++;
                        console.log('#'.repeat(20));
                        console.log('run fuzzing() #' + fuzzingCount);
                        //                    const indexOfRunAgain = orderedActionList.indexOf('runFullQueryAgain');
                        //                      const map: StateActionIdMap = new Map();
                        //                        map.get = () => indexOfRunAgain;
                        const result = await fuzzing(truthTable, 40, // queries
                        20 // events
                        );
                        totalAmountOfHandled = totalAmountOfHandled + result.amountOfHandled;
                        totalAmountOfOptimized = totalAmountOfOptimized + result.amountOfOptimized;
                        const percentage = (totalAmountOfOptimized / totalAmountOfHandled) * 100;
                        const rounded = percentage.toFixed(2);
                        console.log('optimized ' + totalAmountOfOptimized + ' of ' + totalAmountOfHandled +
                            ' which is ' + rounded + '%');
                        const lastErrorAgo = new Date().getTime() - lastErrorFoundTime;
                        const lastErrorHours = lastErrorAgo / 1000 / 60 / 60;
                        console.log('Last error found ' + roundToTwoDecimals(lastErrorHours) + 'hours ago');
                        if (result.ok === false) {
                            console.log('fuzzingFoundError');
                            lastErrorFoundTime = new Date().getTime();
                            fuzzingFoundError = true;
                            console.log(JSON.stringify(result.query));
                            console.log(result.procedure.length + ' ' +
                                JSON.stringify(result.procedure, null, 4));
                            // add as first of array to ensure it will be used first in the future
                            // because new procedures are more likely to hit wrong states.
                            queries.unshift(result.query);
                            procedures.unshift(result.procedure);
                        }
                    }
                    // update table with fuzzing result
                    await generateTruthTable({
                        table: truthTable,
                        queries,
                        procedures,
                        log: true
                    });
                    console.log('saving table to json');
                    const tableObject = mapToObject(truthTable);
                    writeJsonFile(OUTPUT_TRUTH_TABLE_PATH, sortObject(tableObject));
                }
            })();
            break;
        /**
         * Creates a fresh, un-optimized bdd from the truth table.
         * Use this to ensure the bdd still matches a newly generated table.
         */
        case 'create-bdd':
            (async function createBdd() {
                console.log('read table..');
                const truthTable = objectToMap(readJsonFile(OUTPUT_TRUTH_TABLE_PATH));
                console.log('table size: ' + truthTable.size);
                // fill missing rows with unknown
                fillTruthTable(truthTable, truthTable.keys().next().value.length, unknownValueActionId);
                console.log('create bdd..');
                const bdd = createBddFromTruthTable(truthTable);
                console.log('mimizing..');
                console.log('remove unkown states..');
                bdd.removeIrrelevantLeafNodes(unknownValueActionId);
                bdd.log();
                const bddMinimalString = bddToMinimalString(bdd);
                writeBddTemplate(bddMinimalString);
                console.log('nodes after minify: ' + bdd.countNodes());
            })();
            break;
        // optimizes the bdd to become small and fast
        case 'optimize-bdd':
            (async function optimizeBdd() {
                console.log('read table..');
                let lastBetterFoundTime = new Date().getTime();
                const truthTable = objectToMap(readJsonFile(OUTPUT_TRUTH_TABLE_PATH));
                console.log('table size: ' + truthTable.size);
                // fill missing rows with unknown
                fillTruthTable(truthTable, truthTable.keys().next().value.length, unknownValueActionId);
                let currentBest;
                const perfMeasurement = await measurePerformanceOfStateFunctions(10000);
                console.log('state function performance:');
                console.dir(perfMeasurement);
                await optimizeBruteForce({
                    truthTable,
                    iterations: 10000000,
                    afterBddCreation: (bdd) => {
                        const lastBetterAgo = new Date().getTime() - lastBetterFoundTime;
                        const lastBetterHours = lastBetterAgo / 1000 / 60 / 60;
                        console.log('Last better bdd found ' + roundToTwoDecimals(lastBetterHours) + 'hours ago');
                        bdd.removeIrrelevantLeafNodes(unknownValueActionId);
                        if (currentBest) {
                            console.log('current best bdd has ' + currentBest.countNodes() + ' nodes ' +
                                'and a quality of ' + QUALITY_BY_BDD_CACHE.get(currentBest));
                        }
                    },
                    compareResults: async (a, b) => {
                        const betterOne = await getBetterBdd(a, b, perfMeasurement, getQueryVariations(), getTestProcedures());
                        return betterOne;
                    },
                    onBetterBdd: async (res) => {
                        console.log('#'.repeat(100));
                        console.log('## found better bdd ##');
                        lastBetterFoundTime = new Date().getTime();
                        currentBest = res.bdd;
                        const bddMinimalString = bddToMinimalString(currentBest);
                        const quality = QUALITY_BY_BDD_CACHE.get(currentBest);
                        console.log('nodes: ' + currentBest.countNodes());
                        console.log('quality: ' + quality);
                        console.log('new string: ' + bddMinimalString);
                        writeBddTemplate(bddMinimalString);
                        console.log('-'.repeat(100));
                    },
                    log: true
                });
            })();
            break;
        default:
            throw new Error('no use for command ' + command);
    }
}
run();
//# sourceMappingURL=runner.node.js.map