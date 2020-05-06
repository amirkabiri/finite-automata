class FiniteAutomata{
    constructor({ start, states, symbols } = {}){
        this._start = start || null;
        this._states = states || {};
        this._symbols = symbols || [];
    }

    // this method predicts symbols from this._states object and returns an array
    _predictSymbols(){
        const symbols = [];

        for(let state in this._states){
            const { transitions } = this._states[state];
            for(let symbol in transitions){
                if(symbol === '') continue;

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
            throw new Error(start + ' state does not exits in this finite automata');
        }

        this._start = start;
        return this;
    }

    get symbols(){
        const predictedSymbols = this._predictSymbols();

        if(predictedSymbols.length > this._symbols.length) return predictedSymbols;

        return this._symbols;
    }
    set symbols(symbols){
        if(!Array.isArray(symbols)){
            throw new Error('symbols should be array');
        }

        this._symbols = symbols;
        return this;
    }

    get states(){
        return this._states;
    }
    set states(states){
        if(typeof states !== 'object'){
            throw new Error('states should be object');
        }

        this._states = states;
        return this;
    }

    isDFA(){
        for(let name in this._states){
            const { transitions } = this._states[name];

            // if this state had lambda symbol
            // return false, that means this is not a dfa
            if(transitions[''] !== undefined) return false;

            for(let symbol of this._symbols){
                // if with a symbol, was connected to more than one state
                // return false, that means this is not a dfa
                if(transitions[symbol] === undefined || transitions[symbol].length !== 1){
                    return false;
                }
            }
        }

        // this is a dfa
        return true;
    }

    import(json){
        try{
            json = JSON.parse(json);
        }catch (e) {
            throw new Error('imported string is not a valid json');
        }

        if('states' in json && typeof json.states === 'object'){
            for(let key in json.states){
                this._states[key] = new State(json.states[key]);
            }
        }
        if('states' in json && 'start' in json && Object.keys(json.states).includes(json.start)){
            this._start = json.start;
        }
        if('symbols' in json && Array.isArray(json.symbols)){
            this._symbols = json.symbols;
        }

        return this;
    }
    export(){
        return JSON.stringify({
            start : this._start,
            states : this._states,
            symbols : this._symbols,
        });
    }

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
            this._states[name].renderSelfSymbols(ctx);
        }

        for(let name in this._states){
            this._states[name].renderSymbols(ctx);
        }

        for(let name in this._states){
            this._states[name].renderState(ctx);
        }

        return this;
    };


    removeState(name){
        if(this._states[name] === undefined){
            throw Error(name + ' state not found');
        }

        // if state was start point, ...
        if(name === this._start){
            this._start = null;
        }

        // remove symbols from other states to this state
        for(let key in this._states){
            const state = this._states[key];
            for(let symbol in state.transitions){
                state.transitions[symbol] = state.transitions[symbol].filter(target => target !== name);
            }
        }

        delete this._states[name];
        return this;
    }

    addState(data){
        if(this._states[data.name] !== undefined){
            throw Error(data.name + ' state already exits');
        }

        this._states[data.name] = new State(data);

        return this;
    }
}
