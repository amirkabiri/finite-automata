
const welcomeModal = new Modal('welcome-modal', { open : true });
$('#welcome-modal-skip').onclick = () => welcomeModal.close();
$('#welcome-modal-tutorial').onclick = () => {
    welcomeModal.close();
    introJs().start();
};


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


let fa = new FiniteAutomata;
fa.import(load());
render();

$('#reset').onclick = function(){
    if(!confirm('Are you sure? everything will be removed')) return;

    fa = new FiniteAutomata;
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
    try{
        fa = minimizeDFA(fa);
        render();
    }catch (e) {
        if(e instanceof IsNotDeterministicError){
            alert(e.message);
        }else{
            console.log(e);
        }
    }
};

$('#convert2dfa').onclick = () => {
    let { symbols } = fa;
    symbols = prompt('enter symbols without space : ', symbols.join(''));
    if(symbols === null) return;
    fa.symbols = symbols.split('');

    try{
        fa = convertNFA2DFA(fa);
        fa = removeUselessStates(fa);
        render();
    }catch (e) {
        if(e instanceof NoStartPointError){
            alert(e.message);
        }else{
            console.log(e);
        }
    }
};

$('#complement').onclick = () => {
    try{
        fa = dfaComplement(fa);
        render();
    }catch (e) {
        if(e instanceof IsNotDeterministicError){
            alert(e.message);
        }else{
            console.log(e);
        }
    }
};

window.onkeydown = function(e){
    if(mode !== 'design' && e.ctrlKey){
        $('#mode [data-key="design"]').click();
    }
};
window.onkeyup = function(e){
    if(mode !== 'move' && e.key === 'Control'){
        $('#mode [data-key="move"]').click();
    }
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
cnv.onmousedown = function({button, x, y }){
    contextMenu();

    if(mode === 'move' && button !== 2){
        const states = fa.findNearestStates(x, y);
        if(states.length){
            activeState = states[0].name;
        }
    }

    if(mode === 'design' && button !== 2){
        const states = fa.findNearestStates(x, y);
        if(states.length) {
            activeState = states[0].name;
        }
    }
};
cnv.onmouseup = function({ x, y }){
    if(mode === 'move' && activeState !== null){
        const state = fa.states[activeState];
        state.moving = false;

        activeState = null;

        save();
        render();
    }

    if(mode === 'design' && activeState !== null){
        const states = fa.findNearestStates(x, y);
        if(states.length){
            const start = fa.states[activeState];
            const target = states[0];
            const symbol = prompt('enter symbol . for lambda symbol enter nothing and press ok');

            if(symbol !== null) start.translate(symbol, target.name);
        }
        render();
        save();
        activeState = null;
    }
};
cnv.onmousemove = function({ x, y }){
    if(mode === 'move' && activeState !== null){
        const movingState = fa.states[activeState];

        movingState.x = x;
        movingState.y = y;

        render();
    }

    if(mode === 'design' && activeState !== null){
        const beginState = fa.states[activeState];
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
function onTransitionRemoveClick(data){
    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

    if(states.length){
        const state = states[0];
        const [symbol, target] = data.split('-');

        if(symbol in state.transitions && state.transitions[symbol].includes(target)){
            state.transitions[symbol] = state.transitions[symbol].filter(s => s !== target);
        }
    }

    render();
    contextMenu();
}
cnv.oncontextmenu = function(e){
    e.preventDefault();
    const { x, y } = e;
    contextMenuPos = {x, y};
    const states = fa.findNearestStates(x, y);

    if(states.length){
        const state = states[0];
        const items = [
            {
                text : 'terminal ' + (state.terminal ? 'off' : 'on'),
                onclick : () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

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
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        const oldName = state.name;
                        const newName = prompt('enter new name');

                        if(fa.states[newName] !== undefined){
                            alert(newName + ' already exists');
                        }else{
                            if(fa.start === oldName){
                                fa.start = newName;
                            }

                            fa.states[newName] = fa.states[oldName];
                            fa.states[newName].name = newName;
                            delete fa.states[oldName];

                            for(let key in fa.states){
                                const state = fa.states[key];

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
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        try{
                            fa.removeState(state.name);
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

        const removeTransitionsMenu = [];
        for(let symbol in state.transitions){
            for(let target of state.transitions[symbol]){
                removeTransitionsMenu.push({
                    text : `σ({${ state.name }}, ${ symbol === '' ? 'λ' : symbol }) = {${ target }}`,
                    data : `${ symbol }-${ target }`,
                    onclick : onTransitionRemoveClick,
                });
            }
        }
        if(removeTransitionsMenu.length){
            items.push({
                text : 'remove transitions',
                children : removeTransitionsMenu
            })
        }

        if(fa.start !== state.name){
            items.push({
                text : 'make start point',
                onclick : () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if(states.length){
                        const state = states[0];
                        fa.start = state.name;

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
                            fa.addState({
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
