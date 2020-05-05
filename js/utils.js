function createCanvas(width = 320, height = 160){
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
        return tailPS.concat(tailPS.map(function(e) { return [head].concat(e); }));
    })(l.slice());
}

window.$ = (...q) => document.querySelector(q);
window.$$ = (...q) => document.querySelectorAll(q);
