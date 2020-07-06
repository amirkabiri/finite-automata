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
                    item => item.trim().split('').map(
                        value => new GrammarExpression(value)
                    )
                )
            );
        }

        return new Grammar({ grammar, start });
    }

    simplify(){
        return this
            .removeUnreachableVariables()
            .removeLoopVariables()
            .replaceLambda()
            .removeUnitProductions();
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
            for(let i in grammar[variable]){
                grammar[variable][i] = grammar[variable][i].filter(expression => !variables.includes(expression.value));
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
                    let find = simplified.findVariable(statement[0].value);

                    if(find === null || grammar[find].length !== 1){
                        find = simplified.unusedVariableNames.shift();
                        grammar[find] = [[new GrammarExpression(statement[0].value)]];
                    }

                    grammar[variable][statementIndex][0] = new GrammarExpression(find);

                    if(! simplified.statementIsValidForChomsky({ statement, variable, start})){
                        find = simplified.findVariable(statement.slice(1).map(({ value }) => value).join(''));

                        if(find === null || grammar[find].length !== 1){
                            find = simplified.unusedVariableNames.shift();
                            grammar[find] = [statement.slice(1)];
                        }

                        grammar[variable][statementIndex] = [statement[0], new GrammarExpression(find)];
                    }
                }else{
                    let find = simplified.findVariable(statement.slice(1).map(({ value }) => value).join(''));

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

    findVariable(statement){
        for(let variable of this.variables){
            if(this.grammar[variable].some(s => s.map(({ value }) => value).join('') === statement)){
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
}


const grammar = new Grammar().parse(`
S -> b | A
A -> a | S | aA
`);
console.log(grammar.stringify());

const simplifiedGrammar = grammar.simplify();
console.log(simplifiedGrammar.stringify());

const chomskyNormalForm = simplifiedGrammar.toCNF();
console.log(chomskyNormalForm.stringify())