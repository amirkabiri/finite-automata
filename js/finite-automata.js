class FA{
    constructor(){
        this.start = null;
        this.states = {};
        this.symbols = [];
    }

    predictSymbols(){
        const symbols = [];

        for(let state in this.states){
            const { transitions } = this.states[state];
            for(let symbol in transitions){
                if(symbol === '') continue;

                symbols.push(symbol);
            }
        }

        return symbols;
    }

    getSymbols(){
        const predictedSymbols = this.predictSymbols();

        if(predictedSymbols.length > this.symbols.length) return predictedSymbols;

        return this.symbols;
    }

    isDFA(){
        for(let name in this.states){
            const { transitions } = this.states[name];

            // if this state had lambda symbol
            if(transitions[''] !== undefined) return false;

            for(let symbol of this.getSymbols()){
                // if with a symbol, was connected to more than one state
                if(transitions[symbol] === undefined || transitions[symbol].length !== 1){
                    return false;
                }
            }
        }

        return true;
    }

    renderStart = function(){
        if(this.states[this.start] === undefined) return;

        const state = this.states[this.start];
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
    };
    render(){
        this.renderStart();

        for(let name in this.states){
            this.states[name].renderSelfSymbols();
        }

        for(let name in this.states){
            this.states[name].renderSymbols();
        }

        for(let name in this.states){
            this.states[name].renderState();
        }
        return this;
    };
    findNearestStates(x, y){
        return Object.values(this.states).filter(state => {
            const distance = Math.sqrt(
                Math.pow(x - state.x, 2) + Math.pow(y - state.y, 2)
            );

            return distance <= state.getRadius();
        });
    }
    jsonParse(json){
        json = JSON.parse(json);

        if('states' in json){
            for(let key in json.states){
                this.states[key] = new State(json.states[key]);
            }
        }
        if('start' in json){
            this.start = json.start;
        }
        if('symbols' in json){
            this.symbols = json.symbols;
        }

        return this;
    }
    jsonStringify(){
        return JSON.stringify(this);
    }
    removeState(name){
        if(this.states[name] === undefined){
            throw Error(name + ' state not found');
        }

        // if removing state was start point, ...
        if(name === this.start){
            this.start = null;
        }

        // remove symbols from other states to this state
        for(let key in this.states){
            const state = this.states[key];
            for(let symbol in state.transitions){
                state.transitions[symbol] = state.transitions[symbol].filter(target => target !== name);
            }
        }

        delete this.states[name];
        return this;
    }

    addState(data){
        if(this.states[data.name] !== undefined){
            throw Error(data.name + ' state already exits');
        }

        this.states[data.name] = new State(data);

        return this;
    }

    setStates(states = {}){
        this.states = states;
        return this;
    }
    setSymbols(symbols = []){
        this.symbols = symbols;
        return this;
    }
}
