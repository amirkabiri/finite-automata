class State {
    constructor({ name, terminal, x, y, transitions }) {
        this.name = name;
        this.terminal = !!terminal;
        this.x = +x;
        this.y = +y;
        this.transitions = transitions || {};
    }

    translate = function (symbol, state) {
        if (this.transitions[symbol] === undefined) {
            this.transitions[symbol] = [];
        }
        if (!this.transitions[symbol].includes(state)) {
            this.transitions[symbol].push(state);
        }

        return this;
    };

    getRadius = function () {
        return (
            config.state.radius +
            (this.terminal ? config.state.terminalRadius : 0)
        );
    };

    renderSelfSymbols = function () {
        const symbols = [];

        const lineDrawed = {};

        for (let symbol in this.transitions) {
            for (let target of this.transitions[symbol]) {
                // draw lines
                if (fa.states[target] === undefined) continue;
                const state = fa.states[target];
                if (
                    lineDrawed[this.name + '-' + state.name] === undefined &&
                    lineDrawed[state.name + '-' + this.name] === undefined
                ) {
                    lineDrawed[state.name + '-' + this.name] = true;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(state.x, state.y);
                    ctx.stroke();
                    ctx.closePath();
                }

                // put symbols for drawing self symbols
                if (this.name !== target) continue;
                symbols.push(symbol);
            }
        }

        if (symbols.length === 0) return this;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.arc(0, 1.5 * config.state.radius, 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = 'black';
        ctx.font = '15px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            symbols.map(c => (c === '' ? 'λ' : c)).join(','),
            0,
            2.9 * config.state.radius
        );

        ctx.restore();

        return this;
    };

    renderSymbols = function () {
        const targets = {};

        for (let symbol in this.transitions) {
            for (let target of this.transitions[symbol]) {
                if (targets[target] === undefined) {
                    targets[target] = [];
                }

                targets[target].push(symbol);
            }
        }

        for (let target in targets) {
            if (this.name === target) continue;
            if (fa.states[target] === undefined) continue;
            const state = fa.states[target];
            const dx = state.x - this.x;
            const dy = state.y - this.y;
            const theta = Math.atan2(dy, dx);

            let x = this.x + dx / 3;
            let y = this.y + dy / 3;
            const size = 10;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(theta);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(-size, -size);
            ctx.lineTo(-size, +size);
            ctx.lineTo(+size + 10, 0);
            ctx.lineTo(-size, -size);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();

            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = 'black';
            ctx.font = '15px Tahoma';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                targets[target].map(c => (c === '' ? 'λ' : c)),
                0,
                0
            );
            ctx.restore();
        }
    };

    renderState = function () {
        const state = this;
        ctx.save();

        ctx.strokeStyle = state.moving ? 'black' : 'black';
        ctx.fillStyle = state.moving ? 'black' : 'white';

        if (state.terminal) {
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = '#ddd';
            ctx.arc(state.x, state.y, state.getRadius(), 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(state.x, state.y, config.state.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = state.moving ? 'white' : 'black';
        ctx.font = '15px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.name, state.x, state.y);

        ctx.restore();
    };
}
