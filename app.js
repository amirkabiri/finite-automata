function createCanvas(width = 320, height = 160){
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    return [canvas, canvas.getContext('2d')];
}
function saveMode(){
    try{
        localStorage.mode = mode;
    }catch (e) {
        console.log(e);
    }
}
function loadMode(){
    try{
        return localStorage.mode || 'move';
    }catch (e) {
        console.log(e);
        return 'move';
    }
}
function save(){
    try{
        localStorage.dfa = dfa.jsonStringify();
    }catch (e) {
        console.log(e);
    }
}
function load(){
    try{
        return localStorage.dfa || '{}';
    }catch (e) {
        console.log(e);
        return '{}';
    }
}
function render(cls = true){
    // if(cls) ctx.clearRect(0, 0, cnv.width, cnv.height);
    if(cls) {
        ctx.save();
        ctx.fillStyle = '#ddd';
        ctx.fillRect(0, 0, cnv.width, cnv.height);
        ctx.restore();
    }

    dfa.render();

    return;
    for(let edge in edges){
        const [startI, endI] = edge.split('-');
        const [start, end] = [startI, endI].map(i => states[i]);
        const dx = (end.x - start.x);
        const dy = (end.y - start.y);
        const theta = Math.atan2(dy, dx);
        let x = start.x + dx / 3;
        let y = start.y + dy / 3;
        const size = 10;

        if(startI === endI){
            ctx.save();
            ctx.beginPath();
            ctx.rotate(theta);
            ctx.translate(x, y);
            ctx.arc(0, 1.5 * config.state.radius, 20, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.rotate(theta);
            ctx.translate(x, y);

            ctx.fillStyle = 'black';
            ctx.font = '15px Tahoma';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            //ctx.fillText(edges[edge], 0, 0);

            ctx.fillText(edges[edge].map(c => c === null ? 'λ' : c), 0, 2.9 * config.state.radius);
            ctx.closePath();
            ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    dfa.render();

    for(let edge in edges){
        const [startI, endI] = edge.split('-');
        const [start, end] = [startI, endI].map(i => states[i]);
        const dx = (end.x - start.x);
        const dy = (end.y - start.y);
        const theta = Math.atan2(dy, dx);

        let x = start.x + dx / 3;
        let y = start.y + dy / 3;
        const size = 10;

        if(startI !== endI){
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(theta);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(- size, - size);
            ctx.lineTo(- size, + size);
            ctx.lineTo(+ size + 10, 0);
            ctx.lineTo(- size, - size);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();

            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = 'black';
            ctx.font = '15px Tahoma';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edges[edge].map(c => c === null ? 'λ' : c), 0, 0);
            ctx.restore();
        }
    }
}
function contextMenu(data){
    const contextMenu = $('#context-menu');
    const { style } = contextMenu;

    if(!data) {
        style.display = 'none';
        return;
    }

    let { items, x, y } = data;

    items = items.map(item => '<li onclick="(' + item.onclick + ')()">' + item.text + '</li>');
    contextMenu.innerHTML = items.join('');

    style.display = 'block';
    const rect = contextMenu.getBoundingClientRect();

    if(x + rect.width <= cnv.width){
        style.left = x + 'px';
    }else{
        style.left = cnv.width - rect.width + 'px';
    }

    if(y + rect.height <= cnv.height){
        style.top = y + 'px';
    }else{
        style.top = cnv.height - rect.height + 'px';
    }
}

function State({ name, terminal, x, y, transitions }){
    this.name = name;
    this.terminal = !!terminal;
    this.x = +x;
    this.y = +y;
    this.transitions = transitions || {};

    this.translate = function(symbol, state){
        if(this.transitions[symbol] === undefined){
            this.transitions[symbol] = [];
        }
        if(!this.transitions[symbol].includes(state)){
            this.transitions[symbol].push(state);
        }

        return this;
    };
    this.getRadius = function(){
        return config.state.radius + (this.terminal ? config.state.terminalRadius : 0);
    };
    this.renderSelfSymbols = function(){
        const symbols = [];

        const lineDrawed = {};

        for(let symbol in this.transitions) {
            for (let target of this.transitions[symbol]) {
                // draw lines
                if(dfa.states[target] === undefined) continue;
                const state = dfa.states[target];
                if(lineDrawed[this.name+'-'+state.name] === undefined && lineDrawed[state.name+'-'+this.name] === undefined){
                    lineDrawed[state.name+'-'+this.name] = true;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(state.x, state.y);
                    ctx.stroke();
                    ctx.closePath();
                }

                // put symbols for drawing self symbols
                if(this.name !== target) continue;
                symbols.push(symbol);
            }
        }

        if(symbols.length === 0) return this;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.arc(0, 1.5 * config.state.radius, 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = 'black';
        ctx.font = '15px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbols.map(c => c === '' ? 'λ' : c).join(','), 0, 2.9 * config.state.radius);

        ctx.restore();

        return this;
    };
    this.renderSymbols = function(){
        const targets = {};

        for(let symbol in this.transitions) {
            for (let target of this.transitions[symbol]) {
                if(targets[target] === undefined){
                    targets[target] = [];
                }

                targets[target].push(symbol);
            }
        }

        for(let target in targets) {
            if(this.name === target) continue;
            if(dfa.states[target] === undefined) continue;
            const state = dfa.states[target];
            const dx = (state.x - this.x);
            const dy = (state.y - this.y);
            const theta = Math.atan2(dy, dx);

            let x = this.x + dx / 3;
            let y = this.y + dy / 3;
            const size = 10;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(theta);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(- size, - size);
            ctx.lineTo(- size, + size);
            ctx.lineTo(+ size + 10, 0);
            ctx.lineTo(- size, - size);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();

            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = 'black';
            ctx.font = '15px Tahoma';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(targets[target].map(c => c === '' ? 'λ' : c), 0, 0);
            ctx.restore();
        }
    };
    this.renderState = function(){
        const state = this;
        ctx.save();

        ctx.strokeStyle = state.moving ? 'black' : 'black';
        ctx.fillStyle = state.moving ? 'black' : 'white';

        ctx.beginPath();
        ctx.arc(state.x, state.y, config.state.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        if(state.terminal){
            ctx.beginPath();
            ctx.arc(state.x, state.y, state.getRadius(), 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }

        ctx.fillStyle = state.moving ? 'white' : 'black';
        ctx.font = '15px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.name, state.x, state.y);

        ctx.restore();
    };
}
function DFA(){
    this.start = null;
    this.states = {};
    this.symbols = ['a', 'b'];

    this.isDFA = function(){
        for(let name in this.states){
            const transitions = this.states[name].transitions;

            // if this state had lambda symbol
            if(transitions[''] !== undefined) return false;

            for(let symbol of this.symbols){
                // if with a symbol, was connected to more than one state
                if(transitions[symbol] === undefined || transitions[symbol].length !== 1){
                    return false;
                }
            }
        }

        return true;
    };
    this.renderStart = function(){
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
    this.render = function(){
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
    this.findNearestStates = function(x, y){
        return Object.values(this.states).filter(state => {
            const distance = Math.sqrt(
                Math.pow(x - state.x, 2) + Math.pow(y - state.y, 2)
            );

            return distance <= state.getRadius();
        });
    };
    this.jsonParse = function(json){
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
    };
    this.jsonStringify = function(){
        return JSON.stringify(this);
    };
    this.removeState = function(name){
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
    };
    this.addState = function(data){
        if(this.states[data.name] !== undefined){
            throw Error(data.name + ' state already exits');
        }

        this.states[data.name] = new State(data);

        return this;
    };
    this.setStates = function(states){
        this.states = states;
        return this;
    };
    this.setSymbols = function(symbols){
        this.symbols = symbols;
        return this;
    };
}
function powerset(l) {
    return (function ps(list) {
        if (list.length === 0) {
            return [[]];
        }
        let head = list.pop();
        let tailPS = ps(list);
        return tailPS.concat(tailPS.map(function(e) { return [head].concat(e); }));
    })(l.slice());
}

window.$ = (...q) => document.querySelector(q);
window.$$ = (...q) => document.querySelectorAll(q);

let mode = 'move';
window.onload = () => $('#mode [data-key="' + loadMode() + '"]').click();
const [cnv, ctx] = createCanvas(innerWidth, innerHeight);
document.body.appendChild(cnv);

let contextMenuPos = {x : 0, y : 0};
let activeState = null;
const config = {
    state : {
        radius : 20,
        terminalRadius : 5
    }
};

let dfa = new DFA;
dfa.jsonParse(load());
render();


// prevent opening context menu on custom context menu
$('#context-menu').oncontextmenu = e => e.preventDefault();

$('#reset').onclick = function(){
    if(!confirm('Are you sure? everything will be removed')) return;

    dfa = new DFA;
    save();
    render();
};

$$('#mode > button').forEach(button => button.onclick = function(){
    $$('#mode > button').forEach(button => button.classList.remove('active'));
    mode = this.getAttribute('data-key');
    this.classList.add('active');
    saveMode();
});

$('#export-image').onclick = function(){
    const a = document.createElement('a');
    a.download = 'export-dfa';
    a.href = cnv.toDataURL();
    a.click();
};

$('#minimizedfa').onclick = () => {
    removeUselessStates();
};

function removeUselessStates(){
    let runAgain = false;

    for(let target in dfa.states){
        if(dfa.start === target) continue;

        let isTarget = false;

        for(let name in dfa.states){
            let breakMe = false;
            if(name === target) continue;

            for(let symbol in dfa.states[name].transitions){
                const targets = dfa.states[name].transitions[symbol];

                if(targets.includes(target)){
                    isTarget = true;
                    breakMe = true;
                    break;
                }
            }

            if(breakMe) break;
        }

        if(!isTarget){
            dfa.removeState(target);
            runAgain = true;
        }
    }

    if(runAgain) return removeUselessStates();

    render();
};

$('#convert2dfa').onclick = function (){
    if(dfa.start === null) return alert('there is no start state');

    let symbols = prompt('enter symbols without space');
    if(!symbols) return;
    symbols = [... new Set([... symbols])];

    const stateNames = Object.keys(dfa.states);
    const powerSetOfStates = powerset(stateNames);
    const newDfa = new DFA;
    dfa.setSymbols(symbols);
    newDfa.setSymbols(symbols);
    let terminals = Object.values(dfa.states).filter(state => state.terminal).map(state => state.name);

    let start = [dfa.start];
    if('' in dfa.states[dfa.start].transitions){
        const lambdaTransition = dfa.states[dfa.start].transitions[''];
        start = start.concat(lambdaTransition);
        start.sort();
    }

    for(let state of powerSetOfStates){
        const name = state.sort().join(',');
        const transitions = Object.fromEntries(symbols.map(symbol => [symbol, []]));

        let isTerminal = false;

        for(let s of state){
            if(!isTerminal && terminals.includes(s)){
                isTerminal = true;
            }

            if(dfa.states[s] === undefined) continue;

            s = dfa.states[s];
            for(let symbol of symbols){
                if(s.transitions[symbol] !== undefined){
                    transitions[symbol] = [
                        ... new Set([
                            ... transitions[symbol],
                            ... s.transitions[symbol]
                        ])
                    ];
                }
            }
        }

        for(let symbol of symbols){
            if(transitions[symbol].length === 0){
                transitions[symbol] = [''];
            }
        }

        newDfa.states[name] = new State({
            name,
            x : 30 + Math.random() * (cnv.width - 60),
            y : 30 + Math.random() * (cnv.height - 60),
            terminal : isTerminal,
            transitions : Object.fromEntries(Object.entries(transitions).map(([symbol, target]) => [symbol, [target.sort().join(',')]]))
        });
    }

    newDfa.start = start.join(',');
    dfa = newDfa;
    render();

};

window.onresize = function(){
    cnv.width = window.innerWidth;
    cnv.height = window.innerHeight;

    render();
};
window.onkeypress = function(e){
    switch (e.key) {
        case 'm':
            $('#mode [data-key="move"]').click();
            break;

        case 'd':
            $('#mode [data-key="design"]').click();
            break;
    }
};
cnv.onmousedown = function({ x, y }){
    contextMenu();

    if(mode === 'move'){
        const states = dfa.findNearestStates(x, y);
        if(states.length){
            activeState = states[0].name;
        }
    }

    if(mode === 'design'){
        const states = dfa.findNearestStates(x, y);
        if(states.length) {
            activeState = states[0].name;
        }
    }
};
cnv.onmouseup = function({ x, y }){
    if(mode === 'move' && activeState !== null){
        const state = dfa.states[activeState];
        state.moving = false;

        activeState = null;

        save();
        render();
    }

    if(mode === 'design' && activeState !== null){
        const states = dfa.findNearestStates(x, y);
        if(states.length){
            const start = dfa.states[activeState];
            const target = states[0];
            const symbol = prompt('enter symbol ? for lambda symbol enter nothing and press ok');

            if(symbol !== null) start.translate(symbol, target.name);
        }
        render();
        save();
        activeState = null;
    }
};
cnv.onmousemove = function({ x, y }){
    if(mode === 'move' && activeState !== null){
        const movingState = dfa.states[activeState];

        movingState.x = x;
        movingState.y = y;

        render();
    }

    if(mode === 'design' && activeState !== null){
        const beginState = dfa.states[activeState];
        ctx.clearRect(0, 0, cnv.width, cnv.height);

        ctx.save();
        ctx.beginPath();

        ctx.moveTo(beginState.x, beginState.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.closePath();
        ctx.restore();

        render(false);
    }
};
cnv.oncontextmenu = function(e){
    e.preventDefault();
    const { x, y } = e;
    contextMenuPos = {x, y};
    const states = dfa.findNearestStates(x, y);

    if(states.length){
        const state = states[0];
        const items = [
            {
                text : 'terminal ' + (state.terminal ? 'off' : 'on'),
                onclick : () => {
                    const states = dfa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        state.terminal = !state.terminal;

                        save();
                        render();
                    }

                    contextMenu();
                }
            },{
                text : 'rename state',
                onclick : () => {
                    const states = dfa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        const oldName = state.name;
                        const newName = prompt('enter new name');

                        if(dfa.states[newName] !== undefined){
                            alert(newName + ' already exists');
                        }else{
                            if(dfa.start === oldName){
                                dfa.start = newName;
                            }

                            dfa.states[newName] = dfa.states[oldName];
                            dfa.states[newName].name = newName;
                            delete dfa.states[oldName];

                            for(let key in dfa.states){
                                const state = dfa.states[key];

                                if(state.name === oldName){
                                    state.name = newName;
                                }
                                for(let symbol in state.transitions){
                                    for(let s in state.transitions[symbol]){
                                        if(state.transitions[symbol][s] === oldName){
                                            state.transitions[symbol][s] = newName;
                                        }
                                    }
                                }
                            }

                            save();
                            render();
                        }
                    }

                    contextMenu();
                }
            },{
                text : 'remove state',
                onclick : () => {
                    const states = dfa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        try{
                            dfa.removeState(state.name);
                            save();
                            render();
                        }catch (e) {
                            console.log(e);
                        }
                    }

                    contextMenu();
                }
            }
        ];

        if(dfa.start !== state.name){
            items.push({
                text : 'make start point',
                onclick : () => {
                    const states = dfa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        dfa.start = state.name;

                        save();
                        render();
                    }

                    contextMenu();
                }
            });
        }

        contextMenu({ x, y, items });
    }else{
        contextMenu({ x, y, items : [
                {
                    text : 'create new state',
                    onclick : () => {
                        const { x, y } = contextMenuPos;
                        const name = prompt('whats name of state you wanna create ?');

                        if(name === null) return;

                        try{
                            dfa.addState({
                                name,
                                x,
                                y,
                            });
                        }catch (e) {
                            console.log(e);
                        }

                        save();
                        contextMenu();
                        render();
                    }
                }
            ]});
    }
};