class convertNFA2RE {
    constructor(fa) {
        if (fa.start === null || !Object.keys(fa.states).includes(fa.start)) {
            throw new NoStartPointError();
        }
        if (!fa.hasAnyTerminalState()) {
            throw new NoTerminalStateError();
        }
        if (fa.isGeneralizedFa()) {
            throw new AlreadyConvertedToREError();
        }

        // cloning new fa from originFA
        this.fa = new FiniteAutomata();
        this.fa.import(fa.export());
    }

    /**
     * Converts a NFA to RegularExpression in three steps:
     *
     * Step 1:
     *  Add new start state and make a λ transition to former start states
     *
     * Step 2:
     *  Add new terminal state and make λ transitions from all terminal states to new terminal state
     *  and make all terminal states to non-terminal states except new terminal states
     *
     * Step 3:
     *  While count fa's states is greater than 2 repeat :
     *      find a state which has minimum number of transitions, as currentState
     *      iterate over all transitions of sates that has transition to current state and merge them with current state's transitions
     *      remove current state from fa
     *
     */
    run() {
        const { fa } = this;

        // Step 1
        let newStartState = {
            name: 'λ',
            x: 0,
            y: 0,
            transitions: {
                '': [fa.start],
            },
        };
        fa.addState(newStartState);
        fa.start = newStartState.name;

        // Step 2
        let newTerminalState = {
            name: 'λ' + Object.keys(fa.states).length,
            x: 20,
            y: 20,
            terminal: true,
        };

        let terminalStates = this.getTerminalStates(fa);
        terminalStates.forEach(state => {
            if (state.transitions[''] === undefined) {
                state.transitions[''] = [newTerminalState.name];
            } else {
                state.transitions[''].push(newTerminalState.name);
            }
            state.terminal = false;
        });
        fa.addState(newTerminalState);

        // Step 3
        while (Object.keys(fa.states).length !== 2) {
            let currentState = this.getNextState(fa);

            // states that has transition to current state
            let statesHasTransitionToCurrentState = this.getStatesHasTransitionTo(currentState);

            // symbol of transitions that goes
            // from current state to current state itself (symbol of star transition)
            let starTransitionSymbol = this.getSymbolsOfTransitionToItself(currentState);

            // iterating over states that has transition to current state
            for (let originState of statesHasTransitionToCurrentState) {
                if (!originState) {
                    continue;
                }

                // iterating over transitions of states that has transition to current state
                for (let originTransitionSymbol in originState.transitions) {
                    if (!originState.transitions.hasOwnProperty(originTransitionSymbol)) {
                        continue;
                    }

                    let originTransition = originState.transitions[originTransitionSymbol];
                    if (!originTransition.includes(currentState.name)) {
                        continue;
                    }

                    // iterating over transitions of current state
                    for (let currentStateTransitionSymbol in currentState.transitions) {
                        if (!currentState.transitions.hasOwnProperty(currentStateTransitionSymbol)) {
                            continue;
                        }

                        let currentStateTransition = currentState.transitions[currentStateTransitionSymbol];
                        if (currentStateTransition.length === 0) {
                            continue;
                        }

                        if (starTransitionSymbol.length === 0) {
                            if (originState.transitions[(originTransitionSymbol + currentStateTransitionSymbol).trim()] === undefined) {
                                originState.transitions[(originTransitionSymbol + currentStateTransitionSymbol).trim()] = currentStateTransition;
                            } else {
                                // if there is a transition with the same symbol merge it with transition of current state
                                originState.transitions[(originTransitionSymbol + currentStateTransitionSymbol).trim()] = currentStateTransition.concat(
                                    originState.transitions[(originTransitionSymbol + currentStateTransitionSymbol).trim()]
                                );
                            }
                        } else {
                            // if there is a star transition it must be added to the new transition's symbol
                            // new symbol =>
                            // "symbol_of_transition_of_origin(star_transition_symbols_joined_with_comma)*symbol_of_transition_of_current_state
                            originState.transitions[
                                (originTransitionSymbol + '(' + starTransitionSymbol.join(',') + ')*' + currentStateTransitionSymbol).trim()
                            ] = currentStateTransition;
                        }
                    }

                    // merges same transitions of origin state just for simplifying the RE
                    this.mergeSameTransitionsOf(originState);
                }
            }

            // removes current state from fa
            fa.removeState(currentState.name);
        }

        return fa;
    }

    /**
     * Merges same transitions of a state
     * Same transitions are transitions that have same source and destination states with different transition symbol
     *
     * @example
     * before :
     *          state transitions : {'a':['1','2'], 'b':['3'], 'c':['1','2']}
     * After :
     *          state transitions : {'a,c':['1','2'], 'b':['3']}
     *
     */
    mergeSameTransitionsOf(state) {
        for (let transitionOneSymbol in state.transitions) {
            if (!state.transitions.hasOwnProperty(transitionOneSymbol)) continue;
            let transitionOne = state.transitions[transitionOneSymbol];

            for (let transitionTwoSymbol in state.transitions) {
                if (!state.transitions.hasOwnProperty(transitionTwoSymbol)) continue;
                let transitionTwo = state.transitions[transitionTwoSymbol];

                if (!transitionOne || !transitionTwo || transitionOneSymbol === transitionTwoSymbol) {
                    continue;
                }
                if (transitionOne.length === transitionTwo.length && transitionOne.every(stateName => transitionTwo.includes(stateName))) {
                    state.transitions[
                        '(' +
                            (transitionOneSymbol.trim().length === 0 ? 'λ' : transitionOneSymbol) +
                            ',' +
                            (transitionTwoSymbol.trim().length === 0 ? 'λ' : transitionTwoSymbol) +
                            ')'
                    ] = state.transitions[transitionOneSymbol];
                    delete state.transitions[transitionOneSymbol];
                    delete state.transitions[transitionTwoSymbol];
                }
            }
        }
    }

    /**
     * Get symbols of all transitions that source state and destination state is this state
     * in other words return symbols of all star transitions of this state
     * @param {State} state
     * @returns {Array} Array of symbols of all star transitions
     */
    getSymbolsOfTransitionToItself(state) {
        let result = [];
        for (let transitionSymbol in state.transitions) {
            if (!state.transitions.hasOwnProperty(transitionSymbol)) continue;
            let transition = state.transitions[transitionSymbol];

            if (transition.includes(state.name)) {
                state.transitions[transitionSymbol] = state.transitions[transitionSymbol].filter(st => st !== state.name);
                result.push(transitionSymbol);
            }
        }
        return result;
    }

    /**
     * Get next state for Step 3 of @see convertNFA2RE
     * @param {FiniteAutomata} fa
     * @returns {State}
     */
    getNextState(fa) {
        let result,
            minTransitionCount = 0;
        for (let name in fa.states) {
            if (!fa.states.hasOwnProperty(name)) continue;
            const state = fa.states[name];

            if (!state || fa.start === name || state.terminal) {
                continue;
            }

            let statesHasTransitionFromState = [];
            for (let transitionName in state.transitions) {
                if (!state.transitions.hasOwnProperty(transitionName)) continue;
                const transition = state.transitions[transitionName];

                statesHasTransitionFromState = [...new Set(transition.concat(statesHasTransitionFromState))];
            }
            if (minTransitionCount === 0 || (statesHasTransitionFromState.length !== 0 && statesHasTransitionFromState.length < minTransitionCount)) {
                minTransitionCount = statesHasTransitionFromState.length;
                result = state;
            }
        }
        return result;
    }

    /**
     * Get all states that has transition to state
     * @param {State} state destination state
     * @returns {Array} Array of states that has transition to state
     */
    getStatesHasTransitionTo(state) {
        const { fa } = this;
        let result = [];

        for (let originStateName in fa.states) {
            if (!fa.states.hasOwnProperty(originStateName)) continue;
            const originState = fa.states[originStateName];

            if (!originState || !this.isAnyTransitionBetween(originState, state)) {
                continue;
            }
            result.push(originState);
            result = [...new Set(result)];
        }

        return result;
    }

    /**
     * Check if there is any transition between two states
     * @param {State} from Source state
     * @param {State} to Destination state
     *
     * @returns {Boolean} Returns true if there is any transition otherwise returns false
     */
    isAnyTransitionBetween(from, to) {
        for (let transitionName in from.transitions) {
            if (!from.transitions.hasOwnProperty(transitionName)) continue;
            const transition = from.transitions[transitionName];

            if (transition.includes(to.name)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all terminal states of fa
     * @param {FiniteAutomata} fa
     * @returns {Array} Array of terminal states
     */
    getTerminalStates(fa) {
        let result = [];
        for (let name in fa.states) {
            if (!fa.states.hasOwnProperty(name)) continue;
            const state = fa.states[name];

            if (state && state.terminal) {
                result.push(state);
            }
        }
        return result;
    }
}
