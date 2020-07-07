/**
 * Get all states that has transition to state
 * @param {FiniteAutomata} fa
 * @param {State} state destination state
 * @returns {Array} Array of states that has transition to state
 */
function getStatesHasTransitionTo(fa, state) {
    let result = [];

    for (let originState of fa.states) {
        if (isAnyTransitionBetween(originState, state)) {
            result.push(originState);
        }
    }

    return [...new Set(result)];
}

/**
 * Check if there is any transition between two states
 * @param {State} from Source state
 * @param {State} to Destination state
 *
 * @returns {Boolean} Returns true if there is any transition otherwise returns false
 */
function isAnyTransitionBetween(from, to) {
    for (let transition of Object.values(from.transitions)) {
        if (transition.includes(to.name)) return true;
    }
    return false;
}

/**
 * Get all terminal states of fa
 * @param {FiniteAutomata} fa
 * @returns {Array} Array of terminal states
 */
function getTerminalStates(fa) {
    return Object.values(fa.states).filter(state => state.terminal);
}

/**
 * Creates canvas and returns canvas and context
 * @param width
 * @param height
 * @return {(HTMLCanvasElement|CanvasRenderingContext2D)[]}
 */
function createCanvas(width = 320, height = 160) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    return [canvas, canvas.getContext('2d')];
}

/**
 * Generates power set of array
 * @param {array} l
 */
function powerset(l) {
    return (function ps(list) {
        if (list.length === 0) {
            return [[]];
        }
        let head = list.pop();
        let tailPS = ps(list);
        return tailPS.concat(
            tailPS.map(function (e) {
                return [head].concat(e);
            })
        );
    })(l.slice());
}

/**
 * An helper function to make objects iterable
 * @param object
 * @return {*}
 */
function iterableObject(object) {
    if (typeof object !== 'object') throw new Error('parameter is not an object');

    object[Symbol.iterator] = () => ({
        index: 0,
        collection: Object.values(object),
        next() {
            if (this.index >= this.collection.length) return { done: true };

            return { done: false, value: this.collection[this.index++] };
        },
    });

    return object;
}

window.$ = (...q) => document.querySelector(...q);
window.$$ = (...q) => document.querySelectorAll(...q);

function handleError(e) {
    if (e instanceof CustomError) {
        alert(e.message);
    } else {
        alert('unexpected error occurred. report us on github issues');
        console.log(e);
    }
}
