class cykWordAcceptanceChecker {
    constructor(start, grammar, string) {
        this.start = start;
        this.grammar = grammar;
        this.string = string;
        this.V = {};
        this.n = string.length;
    }

    //TODO: check if grammer is Chomsky Normal Form grammer
    isGrammerCNF() {
        return true;
    }

    check() {
        if(!this.isGrammerCNF())
            throw new GrammerIsNotCNFError();

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
