const welcomeModal = new Modal('welcome-modal', { open: isFirstVisit() });
$('#welcome-modal-skip').onclick = () => welcomeModal.close();
$('#welcome-modal-tutorial').onclick = () => {
    welcomeModal.close();
    introJs().start();
};

let mode = 'move';
window.onload = () => $('#mode [data-key="' + loadMode() + '"]').click();
const [cnv, ctx] = createCanvas(innerWidth, innerHeight);
document.body.appendChild(cnv);

let contextMenuPos = { x: 0, y: 0 };
let activeState = null;
const config = {
    state: {
        radius: 20,
        terminalRadius: 5,
    },
};

let fa = new FiniteAutomata();
fa.import(load());
render();

$('#test').onclick = function () {
    try {
        const nfa2reConverter = new convert2RE(fa);
        const resFA = nfa2reConverter.run();
        let { transitions } = resFA.states[resFA.start];
        let symbol;

        for (symbol in transitions) {
            if (!transitions.hasOwnProperty(symbol)) continue;
            if (transitions[symbol].length) break;
        }

        const machineReadableRegexConverter = new MachineReadableRegexConverter();
        symbol = machineReadableRegexConverter.convert(symbol);
        const regex = new RegExp(`^${symbol}$`);

        const string = prompt('enter string you want to test : ');
        if (string && string.trim()) {
            alert(regex.test(string.trim()) ? 'accepted' : 'failed');
        }
    } catch (e) {
        handleError(e);
    }
};

$('#reset').onclick = function () {
    if (!confirm('Are you sure? everything will be removed')) return;

    fa = new FiniteAutomata();

    try {
        localStorage.removeItem('fa');
        localStorage.removeItem('mode');
    } catch (e) {
        handleError(e);
    }

    render();
};

$$('#mode > button').forEach(
    button =>
        (button.onclick = function () {
            $$('#mode > button').forEach(button => button.classList.remove('active'));
            mode = this.getAttribute('data-key');
            this.classList.add('active');
            saveMode();
        })
);

$('#export-image').onclick = function () {
    const a = document.createElement('a');
    a.download = 'export-dfa';
    a.href = cnv.toDataURL();
    a.click();
};

$('#minimizedfa').onclick = () => {
    try {
        fa = new Minimizer(fa).run();
        render();
        alert('done!');
    } catch (e) {
        handleError(e);
    }
};

$('#convert2dfa').onclick = () => {
    try {
        if (fa.start === null || !Object.keys(fa.states).includes(fa.start)) {
            throw new NoStartPointError();
        }

        let { symbols } = fa;
        symbols = prompt('enter symbols without space : ', symbols.join(''));
        if (symbols === null) return;
        fa.symbols = symbols.split('');

        fa = convertNFA2DFA(fa);
        fa = removeUselessStates(fa);
        render();
        alert('done!');
    } catch (e) {
        handleError(e);
    }
};

$('#convert2re').onclick = () => {
    try {
        const converter = new convert2RE(fa);
        const resFA = converter.run();
        let { transitions } = resFA.states[resFA.start];
        let symbol;

        for (symbol in transitions) {
            if (!transitions.hasOwnProperty(symbol)) continue;
            if (transitions[symbol].length) break;
        }

        if (confirm(`result : ${symbol} \n click ok to copy to clipboard`)) {
            navigator.clipboard.writeText(symbol).then(() => alert('copied to clip'));
        }
    } catch (e) {
        handleError(e);
    }
};

$('#complement').onclick = () => {
    try {
        fa = dfaComplement(fa);
        render();
    } catch (e) {
        handleError(e);
    }
};

window.onkeydown = function (e) {
    if (mode !== 'design' && e.ctrlKey) {
        $('#mode [data-key="design"]').click();
    }
};
window.onkeyup = function (e) {
    if (mode !== 'move' && e.key === 'Control') {
        $('#mode [data-key="move"]').click();
    }
};
window.onresize = function () {
    cnv.width = window.innerWidth;
    cnv.height = window.innerHeight;

    render();
};
window.onkeypress = function (e) {
    switch (e.key) {
        case 'm':
            $('#mode [data-key="move"]').click();
            break;

        case 'd':
            $('#mode [data-key="design"]').click();
            break;
    }
};
cnv.onmousedown = function ({ button, x, y }) {
    contextMenu();

    if (mode === 'move' && button !== 2) {
        const states = fa.findNearestStates(x, y);
        if (states.length) {
            activeState = states[0].name;
        }
    }

    if (mode === 'design' && button !== 2) {
        const states = fa.findNearestStates(x, y);
        if (states.length) {
            activeState = states[0].name;
        }
    }
};
cnv.onmouseup = function ({ x, y }) {
    if (mode === 'move' && activeState !== null) {
        const state = fa.states[activeState];
        state.moving = false;

        activeState = null;

        save();
        render();
    }

    if (mode === 'design' && activeState !== null) {
        const states = fa.findNearestStates(x, y);
        if (states.length) {
            const start = fa.states[activeState];
            const target = states[0];
            const symbol = prompt('enter symbol . for lambda symbol enter nothing and press ok');

            if (symbol !== null) start.translate(symbol, target.name);
        }
        render();
        save();
        activeState = null;
    }
};
cnv.onmousemove = function ({ x, y }) {
    if (mode === 'move' && activeState !== null) {
        const movingState = fa.states[activeState];

        movingState.x = x;
        movingState.y = y;

        render();
    }

    if (mode === 'design' && activeState !== null) {
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
function onTransitionRemoveClick(data) {
    contextMenu();
    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);
    if (!states.length) return false;

    const state = states[0];
    const [symbol, target] = data.split('-');

    if (symbol in state.transitions && state.transitions[symbol].includes(target)) {
        state.transitions[symbol] = state.transitions[symbol].filter(s => s !== target);
        if (state.transitions[symbol].length === 0) {
            delete state.transitions[symbol];
        }
    }

    save();
    render();
}
function onTransitionRenameClick(data) {
    contextMenu();
    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

    // no state selected, so terminate the rest of execution
    if (!states.length) return false;

    const state = states[0];
    const [symbol, target] = data.split('-');
    const newSymbol = prompt('enter symbol. for lambda symbol enter nothing and press ok', symbol);
    // if operation canceled or newSymbol is equals to old symbol, terminate the rest of execution
    if (newSymbol === null || newSymbol === symbol) return false;

    if (state.transitions[symbol].length > 1) {
        state.transitions[symbol] = state.transitions[symbol].filter(s => s !== target);
        if (!state.transitions[newSymbol] || state.transitions[newSymbol].length === 0) {
            state.transitions[newSymbol] = [];
        }
        state.transitions[newSymbol].push(target);
    } else {
        delete state.transitions[symbol];
        if (state.transitions[newSymbol]) {
            state.transitions[newSymbol].push(target);
            state.transitions[newSymbol] = [...new Set(state.transitions[newSymbol])];
        } else {
            state.transitions[newSymbol] = [target];
        }
    }

    save();
    render();
}
cnv.oncontextmenu = function (e) {
    e.preventDefault();
    const { x, y } = e;
    contextMenuPos = { x, y };
    const states = fa.findNearestStates(x, y);

    if (states.length) {
        const state = states[0];
        const items = [
            {
                text: 'terminal ' + (state.terminal ? 'off' : 'on'),
                onclick: () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if (states.length) {
                        const state = states[0];
                        state.terminal = !state.terminal;

                        save();
                        render();
                    }

                    contextMenu();
                },
            },
            {
                text: 'rename state',
                onclick: () => {
                    contextMenu();
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);
                    if (!states.length) return false;

                    const state = states[0];
                    const oldName = state.name;
                    const newName = prompt('enter new name', oldName);
                    if (newName === null || !newName.trim() || newName === oldName) return;

                    if (fa.states[newName] !== undefined) {
                        return alert(newName + ' already exists');
                    }

                    fa.states[newName] = fa.states[oldName];
                    fa.states[newName].name = newName;
                    delete fa.states[oldName];

                    // rename transitions target of the other states
                    for (let key in fa.states) {
                        if (!fa.states.hasOwnProperty(key)) continue;

                        const state = fa.states[key];

                        if (state.name === oldName) {
                            state.name = newName;
                        }
                        for (let symbol in state.transitions) {
                            if (!state.transitions.hasOwnProperty(symbol)) continue;

                            for (let s in state.transitions[symbol]) {
                                if (!state.transitions[symbol].hasOwnProperty(s)) continue;

                                if (state.transitions[symbol][s] === oldName) {
                                    state.transitions[symbol][s] = newName;
                                }
                            }
                        }
                    }

                    // if oldName was start, make newName as start point
                    if (fa.start === oldName) {
                        fa.start = newName;
                    }

                    save();
                    render();
                },
            },
            {
                text: 'remove state',
                onclick: () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if (states.length) {
                        const state = states[0];
                        try {
                            fa.removeState(state.name);
                            save();
                            render();
                        } catch (e) {
                            console.log(e);
                        }
                    }

                    contextMenu();
                },
            },
        ];

        const removeTransitionsMenu = [];
        for (let symbol in state.transitions) {
            if (!state.transitions.hasOwnProperty(symbol)) continue;

            for (let target of state.transitions[symbol]) {
                removeTransitionsMenu.push({
                    text: `σ({${state.name}}, ${symbol === '' ? 'λ' : symbol}) = {${target}}`,
                    data: `${symbol}-${target}`,
                    onclick: onTransitionRemoveClick,
                });
            }
        }
        if (removeTransitionsMenu.length) {
            items.push({
                text: 'remove transitions',
                children: removeTransitionsMenu,
            });
        }

        const renameTransitionsMenu = [];
        for (let symbol in state.transitions) {
            if (!state.transitions.hasOwnProperty(symbol)) continue;

            for (let target of state.transitions[symbol]) {
                renameTransitionsMenu.push({
                    text: `σ({${state.name}}, ${symbol === '' ? 'λ' : symbol}) = {${target}}`,
                    data: `${symbol}-${target}`,
                    onclick: onTransitionRenameClick,
                });
            }
        }
        if (renameTransitionsMenu.length) {
            items.push({
                text: 'rename transitions',
                children: renameTransitionsMenu,
            });
        }

        if (fa.start !== state.name) {
            items.push({
                text: 'make start point',
                onclick: () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if (states.length) {
                        const state = states[0];
                        fa.start = state.name;

                        save();
                        render();
                    }

                    contextMenu();
                },
            });
        }

        contextMenu({ x, y, items });
    } else {
        contextMenu({
            x,
            y,
            items: [
                {
                    text: 'create new state',
                    onclick: () => {
                        const { x, y } = contextMenuPos;
                        const name = prompt('whats name of state you wanna create ?');

                        if (name === null || !name.trim()) return;

                        try {
                            fa.addState({
                                name,
                                x,
                                y,
                            });
                        } catch (e) {
                            console.log(e);
                        }

                        save();
                        contextMenu();
                        render();
                    },
                },
            ],
        });
    }
};
