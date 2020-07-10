class dpdaWordAcceptanceChekcer {
    constructor(word) {
        if (!this.isDeterministic()) throw new NotDPDAError();
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

    isDeterministic() {
        for (const { transitions } of fa.states) {
            
            // Removing '[' and ']' and useless spaces and push character form transition
            // Before : '[a, b ,c ]'
            // After : ['a', 'b']
            let readAndPopCharTransitions = Object.keys(transitions).map(transition => {
                let nomalizedTransition = transition
                    .trim()
                    .replace('[', '')
                    .replace(']', '')
                    .trim()
                    .split(',')
                    .map(character => character.trim());
                return [nomalizedTransition[0], nomalizedTransition[1]];
            });

            // Check if there are transitions that goes to different states but
            // has same read character and same pop character
            if (
                readAndPopCharTransitions.map(transition => transition.join(',')).length !==
                [...new Set(readAndPopCharTransitions.map(transition => transition.join(',')))].length
            ) {
                return false;
            }

            // Check if there is a transitions that its read character is '' or 'λ' and
            // its pop character is equal to the pop character of another transition
            // like '[,charA,sth]' and '[sth,charA,sth]' so the charAs are equal and 'sth' can
            // be anything but not '' or 'λ'
            // if pda includes such transition it's non-deterministic
            if (
                readAndPopCharTransitions
                    .filter(transition => transition[0] === '' || transition[0] === 'λ')
                    .some(transition =>
                        readAndPopCharTransitions
                            .filter(transitionB => transitionB !== transition)
                            .map(transitionB => transitionB[1])
                            .includes(transition[1])
                    )
            ) {
                return false;
            }

            for (const transition in transitions) {
                let normalizedTransition = transition.trim().replace('[', '').replace(']', '').trim().split(',');

                // Check if this transition
                // is lambda transition or not ( lambda transition : '[,,,]' or '[λ,λ,λ]')
                if (normalizedTransition.every(char => char.trim() === '' || char.trim() === 'λ')) {
                    return false;
                }

                // Check if there is a transition that goes to different states
                // with same characters
                if (transitions[transition].length > 1) {
                    return false;
                }
            }
        }
        return true;
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
                for (let i = pushChar.length - 1; i >=0; i--) {
                    const char = pushChar[i];
                    this.stack.push(char);
                }
                console.log(this.stack);
            }
        }

        if (readChar !== '' && readChar !== 'λ') this.currentCharacterIndex++;
    }
}
