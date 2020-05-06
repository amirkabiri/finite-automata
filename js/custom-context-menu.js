function contextMenu(data){
    let contextMenu = $('#custom-context-menu');

    if(contextMenu === null){
        const ul = document.createElement('ul');
        ul.id = 'custom-context-menu';
        document.body.appendChild(ul);

        // prevent opening default context menu on custom context menu
        ul.oncontextmenu = e => e.preventDefault();

        contextMenu = ul;
    }

    const { style } = contextMenu;

    if(!data) {
        style.display = 'none';
        return;
    }

    let { items, x, y } = data;

    items = items.map(item => '<li onclick="(' + item.onclick + ')()">' + item.text + '</li>');
    contextMenu.innerHTML = items.join('');

    style.display = 'block';
    const rect = contextMenu.getBoundingClientRect();

    if(x + rect.width <= cnv.width){
        style.left = x + 'px';
    }else{
        style.left = cnv.width - rect.width + 'px';
    }

    if(y + rect.height <= cnv.height){
        style.top = y + 'px';
    }else{
        style.top = cnv.height - rect.height + 'px';
    }
}