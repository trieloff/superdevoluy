/*
 * Copyright 2021 Alexandre Capt. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable import/named, import/extensions */

import {
  createTag,
  readBlockConfig,
  loadCSS,
} from '../../scripts/scripts.js';

class TOC extends HTMLElement {
  constructor() {
    super();
    const config = readBlockConfig(this);
    console.log(config);
    const $headings = document.querySelectorAll('main h2, main h3, main h4, main helix-table-of-contents');
    let skip = true;
    const $toc = createTag('div', { class: 'toc' });
    $headings.forEach(($h) => {
      if (!skip && $h.tagName.startsWith('H')) {
        const hLevel = +$h.tagName.substring(1);
        if (hLevel <= +config.levels + 1) {
          const $entry = createTag('div', { class: `toc-entry toc-level-h${hLevel}` });
          $entry.innerHTML = `<a href="#${$h.id}">${$h.innerHTML}</a>`;
          $toc.appendChild($entry);
        }
      }
      if ($h === this) skip = false;
    });
    console.log($toc);
    this.innerHTML = '';
    this.appendChild($toc);
  }
}

customElements.define('helix-table-of-contents', TOC);
loadCSS(`/elements/table-of-contents/table-of-contents.css`);
