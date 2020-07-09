/**
 * New DFA Minimizer
 */

class Minimizer{
    constructor(originFa){
        this.fa = new FiniteAutomata().import(originFa.export());

        // first remove unreachable states
        // its possible after removing unreachable states, NFA becomes deterministic
        // so , after removing unreachable states, we check that FA is deterministic or not
        const cleanedFA = this.removeUnreachableStates(originFa);
        this.fa.import(cleanedFA.export());

        // update symbols array after minimization
        this.fa.symbols = this.fa._predictSymbols();

        if (!this.fa.isDFA()) {
            throw new IsNotDeterministicError();
        }
    }

    run(){
        const fa = this.fa;
        const terminalStates = this.getTerminalStates(this.fa);
        const nonTerminalStates = this.getNonTerminalStates(this.fa);

        const stack = [
            terminalStates,
            nonTerminalStates
        ].filter(set => set.length);
        let result = [];

        while(stack.length){
            const set = stack.pop();

            while(set.length){
                const s1 = set.pop();
                const partition = [s1];

                for(let i = set.length - 1; i > -1; i --){
                    const s2 = set[i];

                    if(this.statesAreSame(s1, s2)){
                        partition.push(s2);
                        set.splice(i, 1);
                    }
                }

                result.push(partition);
            }
        }

        return this.generateDFAFromSets(result);
    }

    generateDFAFromSets(sets){
        const fa = this.fa;
        const dfa = new FiniteAutomata({ symbols: fa._predictSymbols() });

        // creating states
        for(let set of sets){
            const name = set.sort().join(',');
            const state = new State({
                name,
                x : fa.states[set[0]].x,
                y : fa.states[set[0]].y,
                terminal : fa.states[set[0]].terminal,
                transitions : {}
            });

            // finding transitions new targets
            for(let symbol of dfa.symbols){
                const prevTarget = fa.states[set[0]].transitions[symbol][0];
                const newTarget = sets.filter(set => set.includes(prevTarget))[0].sort().join(',');
                state.transitions[symbol] = [newTarget];
            }

            dfa.addState(state);
        }

        // finding start state
        const prevStart = fa.start;
        const newStart = sets.filter(set => set.includes(prevStart));
        dfa.start = newStart.sort().join(',');

        return dfa;
    }

    statesAreSame(s1, s2, visited = {}){
        s1 = String(s1);
        s2 = String(s2);

        if(this.fa.states[s1].terminal !== this.fa.states[s2].terminal) return false;

        if(visited[s1 + '-' + s2] || visited[s2 + '-' + s1]) return true;

        visited[s1 + '-' + s2] = true;
        visited[s2 + '-' + s1] = true;

        const fa = this.fa;
        const states = fa.states;

        for(let symbol of fa.symbols){
            const target1 = states[s1].transitions[symbol][0];
            const target2 = states[s2].transitions[symbol][0];

            if(target1 === target2) continue;
            if(target1 === s2 && target2 === s1) continue;
            if(target1 === s1 && target2 === s2) continue;

            if(!this.statesAreSame(target1, target2, visited)){
                return false;
            }
        }

        return true;
    }

    getTerminalStates(){
        const fa = this.fa;
        const terminals = [];

        for(let state of fa.getStateNames()){
            if(fa.states[state].terminal){
                terminals.push(state);
            }
        }

        return terminals;
    }

    getNonTerminalStates(){
        const fa = this.fa;
        const nonTerminals = [];

        for(let state of fa.getStateNames()){
            if(! fa.states[state].terminal){
                nonTerminals.push(state);
            }
        }

        return nonTerminals;
    }

    removeUnreachableStates(){
        const fa = this.fa;

        const unreachableStates = this.getUnreachableStates(fa);
        for(let unreachableState of unreachableStates){
            fa.removeState(unreachableState);
        }

        return fa;
    }

    getUnreachableStates(){
        const fa = this.fa;
        const reachableStates = this.getReachableStates(fa);
        const allStates = Object.keys(fa.states);

        return allStates.filter(state => !reachableStates.includes(state));
    }

    getReachableStates(){
        const fa = this.fa;
        const stack = [fa.start];
        const visited = {};

        while(stack.length){
            const currentState = stack.pop();

            if(visited[currentState]) continue;

            visited[currentState] = true;

            for(let symbol in fa.states[currentState].transitions){
                if(! fa.states[currentState].transitions.hasOwnProperty(symbol)) continue;

                const targetStates = fa.states[currentState].transitions[symbol];
                for(let targetState of targetStates){
                    stack.push(targetState);
                }
            }
        }

        return Object.keys(visited);
    }
}