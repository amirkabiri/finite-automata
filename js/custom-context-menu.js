function contextMenu(data){
    const contextMenu = $('#context-menu');
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