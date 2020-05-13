function convertNFA2DFA(fa) {
    // if it's a dfa, don't need to convert !
    if (fa.isDFA()) return fa;

    // we need to check here that fa has start state or no
    // even if this was checked when calling this function
    if (fa.start === null || !Object.keys(fa.states).includes(fa.start)) {
        throw new NoStartPointError();
    }

    const symbols = [...new Set([...fa.symbols])];

    const stateNames = Object.keys(fa.states);
    const powerSetOfStates = powerset(stateNames);
    const newFa = new FiniteAutomata({ symbols });
    let terminals = Object.values(fa.states)
        .filter(state => state.terminal)
        .map(state => state.name);

    // find start state in new dfa
    let start = [fa.start];
    // check lambda transitions for finding start state
    if ('' in fa.states[fa.start].transitions) {
        const lambdaTransition = fa.states[fa.start].transitions[''];
        start = start.concat(lambdaTransition);
        start.sort();
    }

    for (let state of powerSetOfStates) {
        // name of new dfa
        const name = state.sort().join(',');
        const transitions = Object.fromEntries(symbols.map(symbol => [symbol, []]));
        let isTerminal = false;

        // this func finds and fills current state transitions
        // for following lambda transitions, we need recursive function
        const fillStateTransitions = state => {
            for (let s of state) {
                if (!isTerminal && terminals.includes(s)) {
                    isTerminal = true;
                }

                if (fa.states[s] === undefined) continue;

                s = fa.states[s];
                for (let symbol of symbols) {
                    if (s.transitions[symbol] === undefined) continue;

                    transitions[symbol] = [...new Set([...transitions[symbol], ...s.transitions[symbol]])];
                }

                // handle lambda transitions
                if (s.transitions[''] !== undefined) {
                    fillStateTransitions(s.transitions['']);
                }
            }
        };
        fillStateTransitions(state);

        for (let symbol of symbols) {
            if (transitions[symbol].length === 0) {
                transitions[symbol] = [''];
            }
        }

        newFa.states[name] = new State({
            name,
            x: 30 + Math.random() * (cnv.width - 60),
            y: 30 + Math.random() * (cnv.height - 60),
            terminal: isTerminal,
            transitions: Object.fromEntries(Object.entries(transitions).map(([symbol, target]) => [symbol, [target.sort().join(',')]])),
        });
    }

    newFa.start = start.join(',');

    return newFa;
}
