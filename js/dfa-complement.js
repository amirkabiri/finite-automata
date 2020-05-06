function IsNotDeterministicError(message){
    this.message = message || 'this finite automata is not deterministic';
}

function dfaComplement(dfa){
    if(!dfa.isDFA()){
        throw new IsNotDeterministicError();
    }

    for(let key in dfa.states){
        const state = dfa.states[key];
        state.terminal = ! state.terminal;
    }

    return dfa;
}