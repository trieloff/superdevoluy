import { loadCSS } from '/scripts/scripts.js';

class Card extends HTMLElement {
  constructor() {
    super();
    let html = '';
    let root = this;
    
    console.log(this.getAttribute('sealed'));

    if (this.getAttribute('sealed')) {
      this.attachShadow({ mode: 'open' });
      root = this.shadowRoot;
    }

    this.querySelectorAll('p').forEach((p) => {
      html += `${p.innerHTML}<br>`;
    });
    root.innerHTML = `<div style="background: blue; margin-bottom: 50px;">${html}</div>`;
  }
}

customElements.define('helix-card', Card);
loadCSS(`/elements/card/card.css`);
