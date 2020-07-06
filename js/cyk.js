class cykWordAcceptanceChecker {
    constructor(start, grammar, terminals, string) {
        this.start = start;
        this.grammar = grammar;
        this.terminals = terminals;
        this.string = string;
        this.V = {};
        this.n = string.length;
    }

    //TODO: check if grammer is Chomsky Normal Form grammer
    isGrammerCNF() {
        return true;
    }

    /**
     * Check if word (this.string) contains a non-terminal character or not.
     * 
     * @returns {Boolean} Returns true if there is a non-terminal character in the string
     */
    isAnyNonTerminalCharacterInWord() {
        return this.string.split('').some(c => !this.terminals.includes(c));
    }

    check() {
        if (!this.isGrammerCNF()) throw new GrammerIsNotCNFError();
        if (this.isAnyNonTerminalCharacterInWord()) throw new NonTerminalCharacterInWordError();
        
        for (let k = 1; k <= this.n; k++) {
            for (let i = 1; i <= this.n - k + 1; i++) {
                let j = i + k - 1;
                this.V[i + ',' + j] = this.getVariable(i, j);
            }
        }
        return this.V['1,' + this.n] !== undefined && this.V['1,' + this.n].includes(this.start);
    }

    getVariable(i, j) {
        if (i == j) return this.getVariablesProduce(this.string[i - 1]);
        let result = [];
        for (let k = i; k < j; k++) {
            let variables = this.getVariablesProduce(this.multipleVariables(this.V[i + ',' + k], this.V[k + 1 + ',' + j]));
            if (variables !== null) result.push(...variables);
        }
        return [...new Set(result)];
    }

    getVariablesProduce(string) {
        string = string.split(',');
        let result = [];
        for (let letter in this.grammar) {
            if (!this.grammar.hasOwnProperty(letter)) continue;
            const values = this.grammar[letter];
            if (string.some(char => values.includes(char))) result.push(letter);
        }
        return result.length === 0 ? null : result;
    }

    multipleVariables(first, second) {
        let result = '';
        first.forEach(firstVariable => {
            second.forEach(secondVariable => {
                result += firstVariable + ' ' + secondVariable + ',';
            });
        });
        return result.length > 0 ? result.slice(0, -1) : result;
    }
}

//----------------------------------------------------------------
// How to use cykWordAcceptanceChecker :
// Just uncomment the lines below.

/*
const grammar = new Grammar().parse(`
S -> AB | BC
A -> BA | a
B -> CC | b
C -> AB | a
`);
const exportedGrammarForCYK = grammar.exportForCYK();
const CYK = new cykWordAcceptanceChecker(exportedGrammarForCYK.start, exportedGrammarForCYK.grammar, exportedGrammarForCYK.terminals, 'baaba');
console.log('CYK : ', CYK.check());
*/

//----------------------------------------------------------------