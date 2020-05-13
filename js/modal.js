class Modal {
    constructor(key, { open } = {}) {
        const template = document.querySelector(`[data-modal="${key}"]`);
        if (!template) {
            throw new Error(key + ' not exists');
        }

        const modal = document.createElement('div');
        modal.className = ['modal', open ? 'open' : ''].join(' ');
        modal.innerHTML = `<div class="modal-body"><div class="modal-close">×</div>${template.innerHTML}</div>`;

        document.body.appendChild(modal);
        template.remove();
        this.modal = modal;

        modal.querySelector('.modal-close').onclick = () => this.close();
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
