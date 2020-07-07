class CustomError {
    constructor(message) {
        this.message = message;
    }
}

class IsNotDeterministicError extends CustomError {
    constructor(message = 'this finite automata is not deterministic') {
        super(message);
    }
}
class IsNotNonDeterministicError extends CustomError {
    constructor(message = 'this finite automata is not non-deterministic') {
        super(message);
    }
}
class NoStartPointError extends CustomError {
    constructor(message = 'there is no start state') {
        super(message);
    }
}
class StateNotFoundError extends CustomError {
    constructor(message = 'state not found in fa') {
        super(message);
    }
}
class StateAlreadyExistsError extends CustomError {
    constructor(message = 'this state already exists') {
        super(message);
    }
}
class SymbolsShouldBeArrayError extends CustomError {
    constructor(message = 'symbols should be array') {
        super(message);
    }
}
class StatesShouldBeObjectError extends CustomError {
    constructor(message = 'states should be object') {
        super(message);
    }
}
class InvalidJsonError extends CustomError {
    constructor(message = 'is not a valid json string') {
        super(message);
    }
}
class NoTerminalStateError extends CustomError {
    constructor(message = 'there is no terminal state') {
        super(message);
    }
}
class AlreadyConvertedToREError extends CustomError {
    constructor(message = 'fa is already converted to re') {
        super(message);
    }
}
class GrammarIsNotCNFError extends CustomError {
    constructor(message = 'grammar is not Chomsky Normal Form grammar') {
        super(message);
    }
}
class NonTerminalCharacterInWordError extends CustomError {
    constructor(message = 'word contains non-terminal characters') {
        super(message);
    }
}