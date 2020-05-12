class FiniteAutomata{
    constructor({ start, states, symbols } = {}){
        // this variable holds name of state or null
        this._start = start || null;

        // this is an object which keys are state names
        // and values of the keys are an object of State class
        this._states = states || {};

        // an array of symbols. example : ['a', 'b']
        this._symbols = symbols || [];
    }


    /**
     * This method predicts used symbols from this._states object and returns an array
     * @return {Array}
     * @private
     */
    _predictSymbols(){
        const symbols = [];

        for(let state in this._states){
            if(!this._states.hasOwnProperty(state)) continue;
            const { transitions } = this._states[state];

            for(let symbol in transitions){
                if(!transitions.hasOwnProperty(symbol)) continue;
                if(symbol === '') continue;

                if(symbols.includes(symbol)) continue;

                symbols.push(symbol);
            }
        }

        return symbols;
    }

    get start(){
        return this._start;
    }
    set start(start){
        if(!Object.keys(this._states).includes(start)){
            throw new StateNotFoundError(start + ' state does not exits in this finite automata')
        }

        this._start = start;
    }

    get symbols(){
        const predictedSymbols = this._predictSymbols();

        if(predictedSymbols.length > this._symbols.length) return predictedSymbols;

        return this._symbols;
    }
    set symbols(symbols){
        if(!Array.isArray(symbols)){
            throw new SymbolsShouldBeArrayError;
        }

        this._symbols = symbols;
        return this;
    }

    get states(){
        return this._states;
    }
    set states(states){
        if(typeof states !== 'object'){
            throw new StatesShouldBeObjectError;
        }

        this._states = states;
    }

    /**
     * Checking this FiniteAutomata is deterministic or not
     * @return {boolean}
     */
    isDFA(){
        for(let name in this._states){
            if(!this._states.hasOwnProperty(name)) continue;

            const { transitions } = this._states[name];

            // if this state had lambda symbol
            // return false, that means this is not a dfa
            if(transitions[''] !== undefined) return false;

            for(let symbol of this._predictSymbols()){
                // if with a symbol, was connected to more than one state
                // or state has not the symbol in transitions object (is not deterministic)
                // return false, that means this is not a dfa
                if(transitions[symbol] === undefined || transitions[symbol].length !== 1){
                    return false;
                }
            }
        }

        // this is a dfa
        return true;
    }

    /**
     * Used for importing an json string that was saved in localStorage
     * @param {string} json
     * @return {FiniteAutomata}
     */
    import(json){
        try{
            json = JSON.parse(json);
        }catch (e) {
            throw new InvalidJsonError('imported string is not a valid json');
        }

        if(json.hasOwnProperty('states') && typeof json.states === 'object'){
            for(let key in json.states){
                if(!json.states.hasOwnProperty(key)) continue;

                this._states[key] = new State(json.states[key]);
            }
        }
        if(json.hasOwnProperty('states') && json.hasOwnProperty('start') && Object.keys(json.states).includes(json.start)){
            this._start = json.start;
        }
        if(json.hasOwnProperty('symbols') && Array.isArray(json.symbols)){
            this._symbols = json.symbols;
        }

        return this;
    }

    /**
     * Export an FiniteAutomata object to save anywhere like localStorage
     * @return {string}
     */
    export(){
        return JSON.stringify({
            start : this._start,
            states : this._states,
            symbols : this._symbols,
        });
    }

    /**
     * Finding states that their distance from (x, y) is less than their radius
     * @param {number} x
     * @param {number} y
     * @return {array}
     */
    findNearestStates(x, y){
        return Object.values(this._states).filter(state => {
            const distance = Math.sqrt(
                Math.pow(x - state.x, 2) + Math.pow(y - state.y, 2)
            );

            return distance <= state.getRadius();
        });
    }

    _renderStartStateArrow(ctx){
        if(this._states[this._start] === undefined) return;

        const state = this._states[this._start];
        const y = state.y;
        const x = state.x - state.getRadius();

        ctx.beginPath();

        ctx.moveTo(x, y);
        ctx.lineTo(x - 30, y);

        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y - 10);

        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 10);

        ctx.stroke();
        ctx.closePath();
    }
    render(ctx){
        this._renderStartStateArrow(ctx);

        for(let name in this._states){
            if(!this._states.hasOwnProperty(name)) continue;

            this._states[name].renderSelfSymbols(ctx);
        }

        for(let name in this._states){
            if(!this._states.hasOwnProperty(name)) continue;

            this._states[name].renderSymbols(ctx);
        }

        for(let name in this._states){
            if(!this._states.hasOwnProperty(name)) continue;

            this._states[name].renderState(ctx);
        }

        return this;
    };


    /**
     * Removing specific state by name
     * @param {string} name
     * @return {FiniteAutomata}
     */
    removeState(name){
        if(this._states[name] === undefined){
            throw new StateNotFoundError(name + ' state not found');
        }

        // if state was start point, make this._start null
        if(name === this._start){
            this._start = null;
        }

        // remove symbols from other states to this state
        for(let key in this._states){
            if(!this._states.hasOwnProperty(key)) continue;

            const state = this._states[key];
            for(let symbol in state.transitions){
                if(!state.transitions.hasOwnProperty(symbol)) continue;

                state.transitions[symbol] = state.transitions[symbol].filter(target => target !== name);
            }
        }

        delete this._states[name];
        return this;
    }

    /**
     * takes an simple object and adds this state to the fa
     * @param {object} data
     * @return {FiniteAutomata}
     */
    addState(data){
        if(this._states[data.name] !== undefined){
            throw new StateAlreadyExistsError(data.name + ' state already exits');
        }

        this._states[data.name] = new State(data);

        return this;
    }
}
