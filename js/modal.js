class Modal {
    constructor(key, { open } = {}) {
        const template = document.querySelector(`[data-modal="${key}"]`);
        if (!template) {
            throw new Error(key + ' not exists');
        }

        const modal = this._createModalElement(template);
        document.body.appendChild(modal);
        this.modal = modal;

        // remove template
        template.remove();

        // close modal when clicked on container
        modal.onclick = () => this.close();
        // don't close modal when clicked on body
        modal.querySelector('.modal-body').onclick = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        // close modal when clicked on close button
        modal.querySelector('.modal-close').onclick = () => this.close();
    }

    _createModalElement(template) {
        const modal = document.createElement('div');
        modal.className = ['modal', open ? 'open' : ''].join(' ');
        modal.innerHTML = `<div class="modal-body"><div class="modal-close">×</div>${template.innerHTML}</div>`;
        return modal;
    }

    get isOpen() {
        const { modal } = this;

        return modal.classList.contains('open');
    }

    toggle() {
        this.modal.classList.toggle('open');
        return this.isOpen;
    }

    open() {
        if (!this.isOpen) {
            this.toggle();
        }
        return true;
    }

    close() {
        if (this.isOpen) {
            this.toggle();
        }
        return false;
    }
}
