class convertCFG2PDA {
    constructor(cfg) {
        this.cfg = cfg.grammar;
        this.terminals = cfg.terminals;
        this.createInitialPDA();
    }

    createInitialPDA() {
        fa = new FiniteAutomata();

        let startState = {
            name: '0',
            x: 300,
            y: 300,
            transitions: {
                '[λ,λ,S]': ['1'],
            },
        };

        let loopState = {
            name: '1',
            x: 450,
            y: 300,
            transitions: {
                '[λ,$,$]': ['2'],
            },
        };

        let acceptState = {
            name: '2',
            x: 600,
            y: 300,
            terminal: true,
        };

        fa.addState(acceptState);
        fa.addState(loopState);
        fa.addState(startState);

        fa.start = startState.name;

        save();
        render();
    }

    run() {
        Object.keys(this.cfg).forEach(variable => {
            this.cfg[variable].forEach(rule => {
                fa.states['1'].transitions[' [λ,' + variable + ',' + rule.replace(/\s/g, '') + '] '] = ['1'];
            });
        });

        this.terminals
            .filter(t => t !== 'λ')
            .forEach(terminal => {
                fa.states['1'].transitions[' [' + terminal + ',' + terminal + ',' + 'λ] '] = ['1'];
            });

        save();
        render();
    }
}

// -------------------------------
// How to use convertCFG2PDA :
// Just uncomment the following lines to use them

/*
const grammar = new Grammar().parse(
    `
S -> aSTb | b
T -> Ta
T -> λ
`
);

const normalizedGrammar = grammar.exportForCYK();

const cfg2pda = new convertCFG2PDA(normalizedGrammar);
cfg2pda.run();
*/
