/**
 * Grammar Class
 * contains :
 *    1. grammar parser : parses plain text to grammar
 *    2. grammar simplifier : simplifies lambda , unit productions, loop variables, unreachable variable
 *    3. grammar optimizer
 *    4. CNF converter : converts grammar to Chomsky normal form
 *    5. GNF converter : converts grammar to Greibach normal form
 */

class Grammar{
    constructor({ start, grammar } = {}){
        this.LAMBDA_SYMBOL = 'λ';
        this.EQUAL_SYMBOL = '->';
        this.SPLITTER_SYMBOL = '|';
        this.allPossibleVariables = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

        grammar = this.optimizeGrammar(grammar);

        this.start = start || null;
        this.grammar = grammar;
    }

    get terminals(){
        const terminals = new Set();

        for(let statements of Object.values(this.grammar))
            for(let statement of statements)
                for(let expression of statement)
                    if(expression.isTerminal())
                        terminals.add(expression.value);

        return [...terminals];
    }

    get variables(){
        return Object.keys(this.grammar);
    }

    get unusedVariableNames(){
        const { variables } = this;
        const unusedVariables = [];

        for(let variable of this.allPossibleVariables){
            if(! variables.includes(variable)){
                unusedVariables.push(variable);
            }
        }

        return unusedVariables;
    }

    optimizeGrammar(grammar){
        if(!grammar) grammar = {};

        // removing useless lambdas , example : A -> aλ
        // result : A -> a
        for(let variable in grammar){
            grammar[variable] = grammar[variable].map(statement => {
                if(statement.length === 1) return statement;

                return statement.filter(e => e.value !== this.LAMBDA_SYMBOL);
            });
        }

        // if expressions is not instance of GrammarExpression class, create and insert new instance of this class
        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            for(let statementIndex in grammar[variable]){
                if(! grammar[variable].hasOwnProperty(statementIndex)) continue;

                for(let expressionIndex in grammar[variable][statementIndex]){
                    if(! grammar[variable][statementIndex].hasOwnProperty(expressionIndex)) continue;

                    if(grammar[variable][statementIndex][expressionIndex] instanceof GrammarExpression) continue;
                    grammar[variable][statementIndex][expressionIndex] = new GrammarExpression(grammar[variable][statementIndex][expressionIndex].value);
                }
            }
        }

        for(let variable in grammar){
            // remove empty statement
            grammar[variable] = grammar[variable].filter(statement => statement.length);

            // remove duplicate statements
            grammar[variable] = grammar[variable].map(statement => statement.map(expression => expression.value).join(''))
            grammar[variable] = [... new Set(grammar[variable])];
            grammar[variable] = grammar[variable].map(statement => statement.split('').map(expression => new GrammarExpression(expression)));

            // remove variable if is empty
            if(!grammar[variable].length){
                delete grammar[variable];

                for(let v in grammar){
                    // filter removed variables from statements
                    grammar[v] = grammar[v].map(statement => statement.filter(expression => expression.isTerminal() || expression.isVariable() && grammar[expression.value] !== undefined));

                    // remove empty statement
                    grammar[v] = grammar[v].filter(statement => statement.length);
                }
            }
        }

        return grammar;
    }

    parse(text){
        const { LAMBDA_SYMBOL, SPLITTER_SYMBOL, EQUAL_SYMBOL } = this;

        const grammar = {};
        let start;
        text = text.split("\n");

        for(let line in text){
            if(!text.hasOwnProperty(line)) continue;

            let row = text[line].trim();
            if(!row.length) continue;

            if(!row.includes(EQUAL_SYMBOL)) throw new Error('SyntaxError in line ' + line + ' : ' + EQUAL_SYMBOL + ' symbol not found');

            const [left, right] = row.split(EQUAL_SYMBOL).map(item => item.trim());

            if(start === undefined) start = left;

            if(grammar[left] === undefined) grammar[left] = [];
            grammar[left] = grammar[left].concat(
                right.split(SPLITTER_SYMBOL).map(
                    item => item.trim().replace(/\s/g, '').split('').map(
                        value => new GrammarExpression(value)
                    )
                )
            );
        }

        return new Grammar({ grammar, start });
    }

    simplify(){
        return this
            .removeLoopVariables()
            .removeUnreachableVariables()
            .removeUnitProductions()
            .replaceLambda();
    }

    removeUnitProductions(){
        const grammar = deepClone(this.grammar);
        const start = this.start;

        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;
            if(variable === start) continue;

            for(let statementIndex in grammar[variable]){
                if(! grammar[variable].hasOwnProperty(statementIndex)) continue;

                let statement = grammar[variable][statementIndex];
                if(! this.statementIsUnitProduction(statement)) continue;

                statement = statement[0];

                grammar[variable] = [
                    ...grammar[variable],
                    ...grammar[statement.value]
                ].filter(s => !(s.length === 1 && s[0].value === statement.value));
            }
        }


        // handle unit-productions of start variable
        for(let statementIndex in grammar[start]){
            if(! grammar[start].hasOwnProperty(statementIndex)) continue;

            let statement = grammar[start][statementIndex];
            if(statement.length > 1 || new GrammarExpression(statement[0].value).isTerminal()) continue;

            if(statement[0].value === start) continue;

            const unitVariable = statement[0].value;
            grammar[start].splice(statementIndex, 1);

            for(let statement of grammar[unitVariable]){
                grammar[start].push(statement);
            }
        }

        // removing unit-production
        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            grammar[variable] = grammar[variable].filter(statement => ! this.statementIsUnitProduction(statement));
        }

        return new Grammar({ start, grammar }).removeUnreachableVariables();
    }

    statementIsUnitProduction(statement){
        return !(statement.length !== 1 || new GrammarExpression(statement[0].value).isTerminal());
    }

    replaceLambda(){
        let grammar = deepClone(this.grammar);
        let start = this.start;
        const stack = [];

        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            if(variable === start) continue;

            const statements = grammar[variable];
            for(let statement of statements){
                if(statement.length === 1 && statement[0].value === this.LAMBDA_SYMBOL){
                    stack.push(variable)
                }
            }
        }

        while(stack.length){
            const variableHasLambda = stack.pop();

            // remove lambda from current variable
            grammar[variableHasLambda] = grammar[variableHasLambda].filter(statement => statement[0].value !== this.LAMBDA_SYMBOL);

            for(let variable in grammar){
                if(! grammar.hasOwnProperty(variable)) continue;

                for(let statementIndex in grammar[variable]){
                    if(! grammar[variable].hasOwnProperty(statementIndex)) continue;

                    const statement = grammar[variable][statementIndex];
                    const statementString = statement.map(e => e.value).join('');

                    const variableHasLambdaIndexes = [];
                    statement.forEach(({ value }, index) => {
                        if(value === variableHasLambda){
                            variableHasLambdaIndexes.push(index);
                        }
                    });

                    if(! variableHasLambdaIndexes.length) continue;

                    for(let set of powerSet(variableHasLambdaIndexes)){
                        if(set.length === 0) continue;

                        let newStatement = statementString.split('');
                        for(let index of set){
                            newStatement[index] = this.LAMBDA_SYMBOL;
                        }

                        if(newStatement.length === 1 && newStatement[0] === this.LAMBDA_SYMBOL && variable !== start){
                            stack.push(variable);
                            // console.log(variable)
                        }else if(newStatement.length > 1){
                            newStatement = newStatement.filter(e => e !== this.LAMBDA_SYMBOL);
                        }

                        grammar[variable].push(newStatement.map(e => new GrammarExpression(e)));
                    }
                }
            }

            grammar = new Grammar({ grammar, start }).removeLoopVariables().grammar;
        }

        return new Grammar({ grammar, start });
    }

    loopVariables(){
        const loops = [];

        for(let variable in this.grammar){
            let isLoop = true;

            for(let statement of this.grammar[variable]){
                if(statement.filter(expression => expression.value === variable).length === 0){
                    isLoop = false;
                    break;
                }
            }

            if(isLoop) loops.push(variable);
        }

        return loops;
    }

    removeLoopVariables(){
        const grammar = deepClone(this.grammar);
        const start = this.start;

        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            // removing useless statements
            // example : D -> D | a | b
            // result : D -> a | b
            grammar[variable] = grammar[variable].filter(statement => !(statement.length === 1 && statement[0].value === variable));
        }

        const grammarObj = new Grammar({ grammar, start });
        const loops = grammarObj.loopVariables();
        return grammarObj.removeVariables(loops);
    }

    removeVariables(variables){
        const grammar = deepClone(this.grammar);
        const start = this.start;

        for(let variable of variables){
            delete grammar[variable];
        }
        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            const statements = grammar[variable];

            for(let statementID = statements.length - 1; statementID > -1; statementID --){
                const statement = statements[statementID];

                if(statement.some(e => variables.includes(e.value))){
                    statements.splice(statementID, 1);
                }
            }
        }

        return new Grammar({ start, grammar });

    }

    removeUnreachableVariables(){
        const grammar = deepClone(this.grammar);
        const start = this.start;

        /* remove undefined variables from statements
         * example :
         *  S -> a | A | B
         *  A -> a
         * output :
         *  S -> a | A
         *  A -> a
         */
        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            grammar[variable] = grammar[variable].map(statement => {
                if(statement.length === 1 && statement[0].value === variable){
                    return '';
                }

                for(let { value } of statement){
                    if(new GrammarExpression(value).isTerminal()) continue;

                    if(this.variables.includes(value)) continue;

                    return '';
                }

                return statement;
            });
        }

        // remove that variables are unreachable in grammar object
        const grammarObj = new Grammar({ grammar, start });
        const unreachableVariables = grammarObj.unreachableVariables();
        return grammarObj.removeVariables(unreachableVariables);
    }

    /**
     * Converts grammar to string
     * @return {string|string}
     */
    stringify(){
        let out = '';
        const variables = [...this.variables.filter(variable => variable !== this.start)];
        if(this.start !== null) variables.unshift(this.start);

        for(let i in variables){
            const variable = variables[i];

            out += variable + ' ' + this.EQUAL_SYMBOL + ' ';
            out += this.grammar[variable].map(statement => statement.map(expression => expression.value).join('')).join(' ' + this.SPLITTER_SYMBOL + ' ');

            if(i < variables.length - 1) out += "\n";
        }

        return out;
    }

    /**
     * Returns array of reachable variables from start variable
     * @return {Array}
     */
    reachableVariables(){
        const { grammar } = this;
        const visited = [];
        const stack = [this.start];

        while(stack.length){
            const variable = stack.pop();

            if(visited.includes(variable)) continue;
            if(grammar[variable] === undefined) continue;

            visited.push(variable);

            for(let statement of grammar[variable]){
                for(let expression of statement){
                    if(expression.isTerminal()) continue;

                    stack.push(expression.value);
                }
            }

        }

        return visited;
    }

    /**
     * Returns array of unreachable variables
     */
    unreachableVariables(){
        const unreachableVariables = [];
        const reachableVariables = this.reachableVariables();

        for(let variable of this.variables){
            if(!reachableVariables.includes(variable)){
                unreachableVariables.push(variable);
            }
        }

        return unreachableVariables;
    }


    /**
     * Check grammar is chomsky normal form
     * @return {boolean}
     */
    isCNF(){
        const grammar = this.grammar;

        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            for(let statement of grammar[variable]){
                if(variable !== this.start && statement.some(({ value }) => value === this.LAMBDA_SYMBOL)){
                    return false;
                }

                if(statement.length === 1 && statement[0].isTerminal()) continue;

                if(statement.length === 2 && statement.every(expression => expression.isVariable())) continue;

                return false;
            }
        }

        return true;
    }

    /**
     * Converts grammar to Chomsky Normal Form
     * @return {Grammar}
     */
    toCNF(){
        let start = this.start;
        let grammar = deepClone(this.grammar);

        // if start variable appears in right side, create new start and link to prev start variable
        if(this.startVariableAppearsInRightSide()){
            const prevStart = start;
            start = this.unusedVariableNames.shift();
            grammar[start] = [[new GrammarExpression(prevStart)]];
        }

        const simplified = new Grammar({ start, grammar }).simplify();
        grammar = simplified.grammar;
        start = simplified.start;

        for(let variable of simplified.variables){
            for(let statementIndex in grammar[variable]){
                const statement = grammar[variable][statementIndex];

                if(simplified.statementIsValidForChomsky({ statement, variable, start })){
                    continue;
                }

                if(statement[0].isTerminal()){
                    let find = simplified.findVariable(statement[0].value, true);

                    if(find === null || grammar[find].length !== 1){
                        find = simplified.unusedVariableNames.shift();
                        grammar[find] = [[new GrammarExpression(statement[0].value)]];
                    }

                    grammar[variable][statementIndex][0] = new GrammarExpression(find);

                    if(! simplified.statementIsValidForChomsky({ statement, variable, start})){
                        find = simplified.findVariable(statement.slice(1).map(({ value }) => value).join(''), true);

                        if(find === null || grammar[find].length !== 1){
                            find = simplified.unusedVariableNames.shift();
                            grammar[find] = [statement.slice(1)];
                        }

                        grammar[variable][statementIndex] = [statement[0], new GrammarExpression(find)];
                    }
                }else{
                    let find = simplified.findVariable(statement.slice(1).map(({ value }) => value).join(''), true);

                    if(find === null || grammar[find].length !== 1){
                        find = simplified.unusedVariableNames.shift();
                        grammar[find] = [statement.slice(1)];
                    }

                    grammar[variable][statementIndex] = [statement[0], new GrammarExpression(find)];

                }
            }
        }


        return new Grammar({ start, grammar });
    }

    /**
     * Finds variable with special statement
     * if strict is true, finds a variable with length of 1
     * @param statement
     * @param strict
     * @return {string|null}
     */
    findVariable(statement, strict = false){
        const searchMethod = strict ? 'every' : 'some';

        for(let variable of this.variables){
            if(this.grammar[variable][searchMethod](s => s.map(({ value }) => value).join('') === statement)){
                return variable;
            }
        }

        return null;
    }

    startVariableAppearsInRightSide(){
        for(let statement of this.grammar[this.start]){
            for(let expression of statement){
                if(expression.isVariable() && expression.value === this.start) return true;
            }
        }
        return false;
    }

    statementIsValidForChomsky({ variable, statement, start } = {}){
        if(variable !== (start || this.start) && statement.some(({ value }) => value === this.LAMBDA_SYMBOL)){
            return false;
        }

        if(statement.length === 1 && new GrammarExpression(statement[0].value).isTerminal()) return true;

        if(statement.length === 2 && statement.every(({ value }) => new GrammarExpression(value).isVariable())) return true;

        return false;
    }

    /**
     * Checks Grammar is in form of Greibach or not
     * @return {boolean}
     */
    isGNF(){
        const grammar = this.grammar;

        for(let variable of this.variables){
            for(let statement of grammar[variable]){
                if(statement.length === 0) continue;

                if(statement[0].isVariable()) return false;

                for(let index = 1; index < statement.length; index ++){
                    const expression = statement[index];

                    if(expression.isTerminal()) return false;
                }
            }
        }

        return true;
    }

    removeLeftRecursions(){
        let start = this.start;
        let grammar = this.grammarDeepClone();
        let variables = Object.keys(grammar);
        let unusedVariables = this.unusedVariableNames;

        // removing left recursions
        for(let variable of variables) {
            const statements = grammar[variable];

            for(let statementID = statements.length - 1; statementID > -1; statementID --) {
                const statement = statements[statementID];

                // if statement.length is 1 , this shows that grammar is not simplified
                if (statement[0].value !== variable) continue;

                const leftRecursionStatement = statements.splice(statementID, 1);

                const newVariable = unusedVariables.shift();
                grammar[newVariable] = [
                    [...leftRecursionStatement[0].slice(1), new GrammarExpression(newVariable)],
                    [new GrammarExpression(this.LAMBDA_SYMBOL)]
                ];

                const statementsLength = statements.length;
                for(let SID = 0; SID < statementsLength; SID ++){
                    statements.push([
                        ...statements[SID],
                        new GrammarExpression(newVariable)
                    ]);
                }
            }
        }

        // doing simplification stuff, because removing left recursions maybe caused to generate lambda
        return new Grammar({ start, grammar }).simplify();
    }

    /**
     * Converts Grammar to Greibach Normal Form
     * @return {Grammar}
     */
    toGNF(){
        let self = this.simplify();

        if(self.isGNF()) return self;

        // removing left recursions
        self = self.removeLeftRecursions();

        let start = self.start;
        let grammar = self.grammarDeepClone();
        let variables = Object.keys(grammar);
        let unusedVariables = self.unusedVariableNames;

        for(let variableID = variables.length - 1; variableID > -1; variableID --){
            const variable = variables[variableID];
            const statements = grammar[variable];

            for(let statementID = statements.length - 1; statementID > -1; statementID --){
                const statement = statements[statementID];

                // if first token of statement is a variable
                if(statement[0].isVariable()){
                    statements.splice(statementID, 1);

                    const VAR = statement[0].value;

                    for(let s of grammar[VAR]){
                        statements.push([
                            ...s,
                            ...statement.slice(1)
                        ]);
                    }

                    variableID ++;
                    break;
                }

                for(let expressionID = 1; expressionID < statement.length; expressionID ++) {
                    const expression = statement[expressionID];

                    if(expression.isVariable()) continue;

                    // if expression is terminal, we should create a variable or find a proper one
                    let VAR = null;

                    // first, let's see that a proper variable exists or not
                    for(let v in grammar){
                        if(! grammar.hasOwnProperty(v)) continue;

                        if(grammar[v].length !== 1) continue;
                        if(grammar[v][0].length !== 1) continue;
                        if(grammar[v][0][0].value !== expression.value) continue;

                        VAR = v;
                    }

                    // if we can't find a proper one, let's create
                    if(VAR === null){
                        VAR = unusedVariables.shift();
                        grammar[VAR] = [
                            [new GrammarExpression(expression.value)]
                        ];
                    }

                    statement[expressionID] = new GrammarExpression(VAR);
                }
            }
        }

        return new Grammar({ start, grammar });
    }

    /**
     * Returns a standard deep clone of grammar, default grammar is this.grammar
     * @param grammar
     * @return {*}
     */
    grammarDeepClone(grammar = this.grammar){
        grammar = deepClone(grammar);

        for(let variable in grammar){
            if(! grammar.hasOwnProperty(variable)) continue;

            for(let statementID in grammar[variable]){
                if(! grammar[variable].hasOwnProperty(statementID)) continue;

                grammar[variable][statementID] = grammar[variable][statementID].map(({ value }) => new GrammarExpression(value));
            }
        }

        return grammar;
    }

    exportForCYK(){
        const { grammar } = this;
        const exportGrammar = {};

        for(let variable of this.variables){
            exportGrammar[variable] = grammar[variable].map(statement => statement.map(e => e.value).join(' '));
        }

        return {
            grammar : exportGrammar,
            start : this.start,
            terminals : this.terminals
        };
    }


    /**
     * Checking grammar is Left-Linear
     * According to Wikipedia:
     *      left-linear grammar is a special type of linear grammar.
     *      the left-linear or left regular grammars, in which all non-terminals in right hand sides are at the left ends.
     *      https://en.wikipedia.org/wiki/Linear_grammar
     * @return {boolean}
     */
    isLeftLinear(){
        const { variables, grammar } = this;

        for(let variable of variables){
            for(let statement of grammar[variable]){
                const statementVariables = statement.filter(e => e.isVariable());

                if(statementVariables.length > 1) return false;
                if(statementVariables.length === 1 && statement[0].isTerminal()) return false;
            }
        }

        return true;
    }

    /**
     * Checking grammar is Right-Linear
     * According to Wikipedia:
     *      right-linear grammar is a special type of linear grammar.
     *      the right-linear or right regular grammars, in which all nonterminals in right hand sides are at the right ends.
     *      https://en.wikipedia.org/wiki/Linear_grammar
     * @return {boolean}
     */
    isRightLinear(){
        const { variables, grammar } = this;

        for(let variable of variables){
            for(let statement of grammar[variable]){
                const statementVariables = statement.filter(e => e.isVariable());

                if(statementVariables.length > 1) return false;
                if(statementVariables.length === 1 && statement[statement.length - 1].isTerminal()) return false;
            }
        }

        return true;
    }

    /**
     * Checking grammar is Linear
     * According to Wikipedia :
     *      a linear grammar is a context-free grammar that has at most one non-terminal in the right hand side of each of its productions.
     *      https://en.wikipedia.org/wiki/Linear_grammar
     * @return {boolean}
     */
    isLinear(){
        const { variables, grammar } = this;

        for(let variable of variables){
            for(let statement of grammar[variable]){
                const statementVariables = statement.filter(e => e.isVariable());

                if(statementVariables.length > 1) return false;
            }
        }

        return true;
    }

    /**
     * Checking grammar is regular
     * @return {boolean}
     */
    isRegular(){
        return this.isLeftLinear() || this.isRightLinear();
    }

    /**
     * Check grammar is Context Free or not
     * @return {boolean}
     */
    isContextFree(){
        return this.variables.every(variable => variable.length === 1);
    }

    /**
     * Checks grammar has potential to be regular or not
     * every production must have at most 1 variable and that variable must be at start or at end of production
     * this method doesn't guarantee that the grammar is regular
     * @return {boolean}
     */
    mayBeRegular(){
        if(! this.isContextFree() || ! this.isLinear()) return false;

        const { variables, grammar } = this;

        for(let variable of variables){
            for(let statement of grammar[variable]){
                const statementVariables = statement.filter(e => e.isVariable());

                if(statementVariables.length > 1) return false;

                if(statementVariables.length === 0) continue;

                if(statement[0].isVariable() || statement[statement.length - 1].isVariable()) continue;

                return false;
            }
        }

        return true;
    }

    toRightLinear(){
        const { grammar, start, variables, unusedVariableNames } = this.removeLeftRecursions();
        let stack = [];

        for(let variable of variables){
            const statements = grammar[variable];

            for(let statementID = statements.length - 1; statementID > -1; statementID --){
                const statement = statements[statementID];
                if(statement[0].isTerminal()) continue;

                const oldVar = statement[0].value;
                const newVar = unusedVariableNames.shift();
                stack.push([oldVar, newVar, statement.slice(1)]);

                statements[statementID] = [new GrammarExpression(newVar)];
            }
        }

        while(stack.length){
            const [oldVar, newVar, stackStatement] = stack.pop();

            grammar[newVar] = [];

            for(let statement of grammar[oldVar]){
                statement = statement.map((e, i) => {
                    if(e.value === oldVar) return new GrammarExpression(newVar);

                    if(e.isVariable()){
                        const oldVar2 = e.value;
                        const newVar2 = unusedVariableNames.shift();

                        stack.push([oldVar2, newVar2, stackStatement]);

                        return new GrammarExpression(newVar2);
                    }

                    return new GrammarExpression(e.value);
                });

                const statementIsTerminal = !statement.filter(e => e.isVariable()).length;

                if(statementIsTerminal){
                    grammar[newVar].push([
                        ...statement,
                        ...stackStatement
                    ]);
                }else{
                    grammar[newVar].push(statement);
                }
            }
        }

        return new Grammar({ start, grammar }).simplify();
    }
}

function deepClone(i){
    return JSON.parse(
        JSON.stringify(i)
    );
}
function powerSet(theArray){
    return theArray.reduce(
        (subsets, value) => subsets.concat(
            subsets.map(set => [value,...set])
        ),
        [[]]
    );
}


class GrammarExpression{
    constructor(value){
        this.value = value;
    }

    isTerminal(){
        const { value } = this;

        if(/^[0-9]$/.test(value)) return true;

        return value.toLowerCase() === value;
    }

    isVariable(){
        return ! this.isTerminal();
    }
}


// let grammar = new Grammar().parse(`
// S -> Aa
// A -> Ab | b
// `).simplify();
// console.log(grammar.stringify());
//
// const rightLinearGrammar = grammar.toRightLinear();
// console.log(rightLinearGrammar.stringify());

/*
const grammar = new Grammar().parse(`
S -> aAB | a | bCA
A -> Aa | bB | B | λ
B -> bB | A
C -> CB | AC
`);
console.log('origin grammar\n', grammar.stringify());

const simplifiedGrammar = grammar.simplify();
console.log('simplified grammar\n', simplifiedGrammar.stringify());

const chomskyNormalForm = grammar.toCNF();
console.log('chomsky normal form\n', chomskyNormalForm.stringify());

const greibachNormalForm = grammar.toGNF();
console.log('greibach normal form\n', greibachNormalForm.stringify());
*/