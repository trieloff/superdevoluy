export default class Card extends HTMLElement {
  constructor() {
    super();
    let html = '';

    this.querySelectorAll('p').forEach((p) => {
      html += `${p.innerHTML}<br>`;
    });
    this.innerHTML = `<div style="margin-bottom: 50px;">${html}</div>`;

    const $style = document.createElement('style');
    $style.innerHTML = /* css */`
main .section-wrapper helix-card > div {
  text-align: left;
  margin-bottom: 50px;
}
`;
    this.appendChild($style);
  }
}