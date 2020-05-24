function createCanvas(width = 320, height = 160) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    return [canvas, canvas.getContext('2d')];
}

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
