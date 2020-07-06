class turingMachine {
    constructor(input) {
        if (!this.isTuringMachineValid()) throw new InvalidTuringMachineError();

        this.initialize(input);
        this.processInput();
    }

    /**
     * Check if there is a transition that goes to
     * diffrent states with same read character
     * @returns {Boolean} Returns true if turing machine is valid
     */
    isTuringMachineValid() {
        for (let { transitions } of fa.states) {
            transitions = Object.keys(transitions).map(transition => (transition = transition.replace('[', '').trim()[0]));

            if (transitions.length !== [...new Set(transitions)].length) return false;
        }
        return true;
    }

    /**
     * Initialize the turing machine based on the input
     * @param {string} input is the initial state of tape of turing machine
     */
    initialize(input) {
        this.tape = input;
        this.isInputAccepted = false;
        this.currentState = fa.states[fa.start];
        this.currentCharacterIndex = 0;
    }

    /**
     * Check all transitions of current state to determine if there is a transition
     * that it's read character is equal to current character of input
     * @returns {String} Returns transiton if there is an possible movement, if not returns null
     */
    getPossibleMovement() {
        for (let i = 0; i < Object.keys(this.currentState.transitions).length; i++) {
            const transition = Object.keys(this.currentState.transitions)[i];

            // Make an normalized transition from unnormalized transition
            // Unnormalized transition : ' [ a,a,R ] '
            // Nomalized transition : ['a', 'a', 'R']
            let nomalizedTransition = transition.trim().replace('[', '').replace(']', '').split(',');

            let readChar = nomalizedTransition[0];

            if (
                readChar === this.tape[this.currentCharacterIndex] ||
                ((readChar.trim() === '◊' || readChar.trim() === '') && this.tape[this.currentCharacterIndex] === undefined)
            )
                return transition;
        }
        return null;
    }

    /**
     * Processes the input (tape)
     */
    processInput() {
        this.possibleMove = this.getPossibleMovement();
        while (this.possibleMove !== null) {
            this.move();
            this.possibleMove = this.getPossibleMovement();
        }
        this.isInputAccepted = this.currentState.terminal;
    }

    /**
     * Check if the turing machine accepts the given word
     *
     * @returns {Boolean} Returns true if the word is acceptable
     */
    checkWordAcceptance(word = '') {
        if (word !== '') {
            this.initialize(word);
            this.processInput();
        }
        return this.isInputAccepted;
    }

    /**
     * First change current state then change input if necessary,
     * at the end move to the next/previous character according to movement direction
     *
     */
    move() {
        let nextStateName = this.currentState.transitions[this.possibleMove];

        this.currentState = fa.states[nextStateName];

        let nomalizedTransition = this.possibleMove.replace('[', '').replace(']', '').trim().split(',');

        let writeChar = nomalizedTransition[1];
        this.tape = this.tape.substr(0, this.currentCharacterIndex) + writeChar + this.tape.substr(this.currentCharacterIndex + writeChar.length);

        let moveDirection = nomalizedTransition[2];
        if (moveDirection.toLowerCase() === 'r') this.currentCharacterIndex++;
        else if (moveDirection.toLowerCase() === 'l') this.currentCharacterIndex--;
        else throw new InvalidTuringMachineError();
    }

    /**
     * This is usefull when you use turing machine to process a function
     * @return {string} Returns processed trap
     */
    getProcessedTape(word = '') {
        if (word !== '') {
            this.initialize(word);
            this.processInput();
        }
        return this.tape;
    }
}
