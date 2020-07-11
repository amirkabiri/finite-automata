function saveMode() {
    try {
        localStorage.mode = mode;
    } catch (e) {
        console.log(e);
    }
}
function loadMode() {
    try {
        return localStorage.mode || 'move';
    } catch (e) {
        console.log(e);
        return 'move';
    }
}
function save() {
    try {
        localStorage.fa = fa.export();
    } catch (e) {
        console.log(e);
    }
}
function load() {
    try {
        return localStorage.fa || '{}';
    } catch (e) {
        console.log(e);
        return '{}';
    }
}
function isFirstVisit() {
    try {
        if (localStorage.fa !== undefined || localStorage.mode !== undefined) return false;

        return true;
    } catch (e) {
        return true;
    }
}

function saveGrammar(grammar){
    try{
        localStorage.grammar = grammar;

        return true;
    }catch (e) {
        return false;
    }
}
function loadGrammar() {
    try {
        return localStorage.grammar;
    }catch (e) {
        return undefined;
    }
}
