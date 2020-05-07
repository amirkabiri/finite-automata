function removeUselessStates(fa){
    let runAgain = false;

    for(let target in fa.states){
        if(fa.start === target) continue;

        let isTarget = false;

        for(let name in fa.states){
            let breakMe = false;
            if(name === target) continue;

            for(let symbol in fa.states[name].transitions){
                const targets = fa.states[name].transitions[symbol];

                if(targets.includes(target)){
                    isTarget = true;
                    breakMe = true;
                    break;
                }
            }

            if(breakMe) break;
        }

        if(!isTarget){
            fa.removeState(target);
            runAgain = true;
        }
    }

    if(runAgain) return removeUselessStates(fa);

    return fa;
}


function minimizeDFA(dfa){
    if(!dfa.isDFA()){
        throw new IsNotDeterministicError;
    }
    const setCanBePartitioned = (dfa, set) => {
        for(let s1 of set){
            for(let s2 of set){
                if(s1 === s2) continue;

                for(let symbol of dfa.symbols){
                    const s1Target = dfa.states[s1].transitions[symbol][0];
                    const s2Target = dfa.states[s2].transitions[symbol][0];

                    if(s1Target === s2Target) continue;
                    if(s1Target === s2 && s2Target === s1) continue;

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
    const run = (dfa) => {
        let stack = [...generateInitSet(dfa)];
        let result = [];

        // console.log('initial set', JSON.stringify(stack));

        while(stack.length){
            const set = stack.pop();

            if(setCanBePartitioned(dfa, set)){
                const partitions = [];

                for(let s of set){
                    let newPartition = null;
                    let partitionIndex;

                    for(partitionIndex in partitions){
                        const partition = partitions[partitionIndex];

                        if(!setCanBePartitioned(dfa,[... partition, s])){
                            newPartition = [... partition, s];
                            break;
                        }
                    }

                    if(newPartition === null){
                        partitions.push([s]);
                    }else{
                        partitions[partitionIndex] = newPartition;
                    }
                }

                stack = [...stack, ...partitions];
            }else{

                result.push(set);
            }
        }

        result = result.map(s => s.sort());
        const newDfa = generateDfaFromSets(dfa, result);

        if(checkEndCondition(dfa, newDfa)) return newDfa;

        return run(newDfa);
    };
    const generateDfaFromSets = (dfa, sets) => {
        const newDfa = new FiniteAutomata({ symbols : dfa.symbols });

        for(let set of sets){
            const name = set.join(',');
            const transitions = {};

            const prevTransitions = JSON.parse(JSON.stringify(dfa.states[set[0]].transitions));
            for(let symbol in prevTransitions){
                const target = prevTransitions[symbol][0];

                for(let set2 of sets){
                    if(set2.includes(target)){
                        transitions[symbol] = [set2.join(',')];
                        break;
                    }
                }
            }

            newDfa.states[name] = new State({
                name,
                x : dfa.states[set[0]].x,
                y : dfa.states[set[0]].y,
                terminal : dfa.states[set[0]].terminal,
                transitions,
            });
        }

        return newDfa;
    };
    const generateInitSet = dfa => {
        let sets = [[], []];
        for(let state in dfa.states){
            sets[+ dfa.states[state].terminal].push(state);
        }
        return sets;
    };
    dfa = removeUselessStates(dfa);

    return run(dfa);
}

