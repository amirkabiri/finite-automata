function removeUselessStates(){
    let runAgain = false;

    for(let target in fa.states){
        if(fa.start === target) continue;

        let isTarget = false;

        for(let name in fa.states){
            let breakMe = false;
            if(name === target) continue;

            for(let symbol in fa.states[name].transitions){
                const targets = fa.states[name].transitions[symbol];

                if(targets.includes(target)){
                    isTarget = true;
                    breakMe = true;
                    break;
                }
            }

            if(breakMe) break;
        }

        if(!isTarget){
            fa.removeState(target);
            runAgain = true;
        }
    }

    if(runAgain) return removeUselessStates();

    render();
}
