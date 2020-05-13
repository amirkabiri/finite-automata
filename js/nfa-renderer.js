function render(cls = true) {
    // if(cls) ctx.clearRect(0, 0, cnv.width, cnv.height);
    if (cls) {
        ctx.save();
        ctx.fillStyle = '#ddd';
        ctx.fillRect(0, 0, cnv.width, cnv.height);
        ctx.restore();
    }

    fa.render(ctx);

    return;
    for (let edge in edges) {
        const [startI, endI] = edge.split('-');
        const [start, end] = [startI, endI].map(i => states[i]);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const theta = Math.atan2(dy, dx);
        let x = start.x + dx / 3;
        let y = start.y + dy / 3;
        const size = 10;

        if (startI === endI) {
            ctx.save();
            ctx.beginPath();
            ctx.rotate(theta);
            ctx.translate(x, y);
            ctx.arc(0, 1.5 * config.state.radius, 20, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.rotate(theta);
            ctx.translate(x, y);

            ctx.fillStyle = 'black';
            ctx.font = '15px Tahoma';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            //ctx.fillText(edges[edge], 0, 0);

            ctx.fillText(
                edges[edge].map(c => (c === null ? 'λ' : c)),
                0,
                2.9 * config.state.radius
            );
            ctx.closePath();
            ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    fa.render();

    for (let edge in edges) {
        const [startI, endI] = edge.split('-');
        const [start, end] = [startI, endI].map(i => states[i]);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const theta = Math.atan2(dy, dx);

        let x = start.x + dx / 3;
        let y = start.y + dy / 3;
        const size = 10;

        if (startI !== endI) {
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
                edges[edge].map(c => (c === null ? 'λ' : c)),
                0,
                0
            );
            ctx.restore();
        }
    }
}
