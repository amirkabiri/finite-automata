function removeUselessStates(fa) {
    let allReachableStatesFromStart = getAllReachableStatesFromStart(fa);
    for (let name in fa.states) {
        const state = fa.states[name];
        if(allReachableStatesFromStart.includes(state)) continue;
        fa.removeState(state.name);
    }
    return fa;
}

/**
 * This method uses the DFS algorithm to traversal the graph of states
 * to find all states that are reachable from start state
 * @param {FiniteAutomata} fa
 * @returns {Array} Array of all states that are reachable from start state
 */
function getAllReachableStatesFromStart(fa) {
    let state = fa.states[fa.start];
    let visited = [];
    let stack = [state];
    while (stack.length > 0) {
        if (!visited.includes(state)) {
            let statesHasTransitionFromState = getStatesHasTransitionFrom(state);
            stack.push(...statesHasTransitionFromState);
            visited.push(state);
        }
        state = stack.pop();
    }
    return visited;
}

/**
 * Get all states that has transition from state
 * @param {State} state origin state
 * @returns {Array} Array of states that has transition from state
 */
function getStatesHasTransitionFrom(state) {
    let result = [];
    //TODO : Decuple this function from convertNFA2RE class
    //       by moving out isAnyTransitionBetween method and some 
    //       other common methods
    let converter = new convertNFA2RE(fa);
    for (let destinationStateName in fa.states) {
        const destinationState = fa.states[destinationStateName];
        if (!destinationState || !converter.isAnyTransitionBetween(state, destinationState)) {
            continue;
        }
        result.push(destinationState);
        result = [...new Set(result)];
    }

    return result;
}

function minimizeDFA(dfa) {
    if (!dfa.isDFA()) {
        throw new IsNotDeterministicError();
    }
    const setCanBePartitioned = (dfa, set) => {
        for (let s1 of set) {
            for (let s2 of set) {
                if (s1 === s2) continue;

                for (let symbol of dfa.symbols) {
                    const s1Target = dfa.states[s1].transitions[symbol][0];
                    const s2Target = dfa.states[s2].transitions[symbol][0];

                    if (s1Target === s2Target) continue;
                    if (s1Target === s2 && s2Target === s1) continue;

                    return true;
                }
            }
        }

        return false;
    };
    const checkEndCondition = (dfa1, dfa2) => {
        const condition = JSON.stringify(generateInitSet(dfa1)) === JSON.stringify(generateInitSet(dfa2));
        // console.log(condition);
        return condition;
    };
    const run = dfa => {
        let stack = [...generateInitSet(dfa)];
        let result = [];

        // console.log('initial set', JSON.stringify(stack));

        while (stack.length) {
            const set = stack.pop();

            if (setCanBePartitioned(dfa, set)) {
                const partitions = [];

                for (let s of set) {
                    let newPartition = null;
                    let partitionIndex;

                    for (partitionIndex in partitions) {
                        const partition = partitions[partitionIndex];

                        if (!setCanBePartitioned(dfa, [...partition, s])) {
                            newPartition = [...partition, s];
                            break;
                        }
                    }

                    if (newPartition === null) {
                        partitions.push([s]);
                    } else {
                        partitions[partitionIndex] = newPartition;
                    }
                }

                stack = [...stack, ...partitions];
            } else {
                result.push(set);
            }
        }

        result = result.map(s => s.sort());
        const newDfa = generateDfaFromSets(dfa, result);

        if (checkEndCondition(dfa, newDfa)) return newDfa;

        return run(newDfa);
    };
    const generateDfaFromSets = (dfa, sets) => {
        const newDfa = new FiniteAutomata({ symbols: dfa.symbols });

        for (let set of sets) {
            const name = set.join(',');
            const transitions = {};

            const prevTransitions = JSON.parse(JSON.stringify(dfa.states[set[0]].transitions));
            for (let symbol in prevTransitions) {
                const target = prevTransitions[symbol][0];

                for (let set2 of sets) {
                    if (set2.includes(target)) {
                        transitions[symbol] = [set2.join(',')];
                        break;
                    }
                }
            }

            newDfa.states[name] = new State({
                name,
                x: dfa.states[set[0]].x,
                y: dfa.states[set[0]].y,
                terminal: dfa.states[set[0]].terminal,
                transitions,
            });
        }

        // finding start state
        for (let set of sets) {
            if (set.includes(dfa.start)) {
                set.sort();
                newDfa.start = set.join(',');
                break;
            }
        }

        return newDfa;
    };
    const generateInitSet = dfa => {
        let sets = [[], []];
        for (let state in dfa.states) {
            sets[+dfa.states[state].terminal].push(state);
        }
        return sets;
    };
    dfa = removeUselessStates(dfa);

    return run(dfa);
}
