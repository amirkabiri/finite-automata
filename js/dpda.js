class dpdaWordAcceptanceChekcer {
    constructor(word) {
        if(!this.isDeterministic()) throw new NotDPDAError();
        this.initialize(word);
    }

    /**
     * Initialize the dpda based on the input
     * @param {string} word is the input that is going to be checked
     */
    initialize(word) {
        this.word = word;
        this.currentCharacterIndex = 0;
        this.stack = ['$'];
        this.currentState = fa.states[fa.start];
    }

    // TODO : Implementing the checking if the PDA is deterministic (DPDA)
    isDeterministic() {
        return true
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
            let nomalizedTransition = transition.replace('[', '').replace(']', '').trim().split(',');

            let readChar = nomalizedTransition[0];
            let popChar = nomalizedTransition[1];

            if (
                (readChar.trim() === '' || readChar.trim() === 'λ' || readChar === this.word[this.currentCharacterIndex]) &&
                (popChar.trim() === '' || popChar.trim() === 'λ' || popChar === this.stack[this.stack.length - 1])
            ) {
                return transition;
            }
        }
        return null;
    }

    /**
     * Check if DPDA accepts the word or not
     */
    check(word = '') {
        if (word.trim() !== '') this.initialize(word);

        this.possibleMove = this.getPossibleMovement();
        while (this.possibleMove !== null && this.word[this.currentCharacterIndex] !== undefined) {
            this.move();
            this.possibleMove = this.getPossibleMovement();
        }

        if (this.word[this.currentCharacterIndex] === undefined && this.possibleMove === '[,$,$]') {
            this.move();
        }
        return this.currentState.terminal && this.word[this.currentCharacterIndex] === undefined;
    }

    /**
     * First change current state then change stack if necessary
     *
     */
    move() {
        let nextStateName = this.currentState.transitions[this.possibleMove];

        this.currentState = fa.states[nextStateName];

        let nomalizedTransition = this.possibleMove.replace('[', '').replace(']', '').trim().split(',');

        let readChar = nomalizedTransition[0].trim();
        let popChar = nomalizedTransition[1].trim();
        let pushChar = nomalizedTransition[2].trim();

        if (popChar !== '' && popChar !== 'λ') {
            this.stack.pop();
        }

        if (pushChar !== '' && pushChar !== 'λ' && ((pushChar !== '$' && pushChar[pushChar.length - 1] !== '$') || this.stack[this.stack.length - 1] !== '$')) {
            if (pushChar.length < 2) {
                this.stack.push(pushChar);
            } else {
                for (let i = 0; i < pushChar.length; i++) {
                    const char = pushChar[i];
                    this.stack.push(char);
                }
            }
        }

        if (readChar !== '' && readChar !== 'λ') this.currentCharacterIndex++;
    }
}