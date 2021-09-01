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

/* global window fetch document */
/* eslint-disable import/named, import/extensions */

import {
  createTag, loadCSS
} from '../../scripts/scripts.js';

function masonrize($cells, $masonry, force) {
  const colWidth = 264;

  const width = $masonry.offsetWidth;
  // console.log($masonry.offsetWidth);
  let numCols = Math.floor(width / colWidth);
  if (numCols < 1) numCols = 1;
  if ((numCols !== $masonry.children.length) || force) {
    $masonry.innerHTML = '';
    const columns = [];
    for (let i = 0; i < numCols; i += 1) {
      const $column = createTag('div', { class: 'masonry-col' });
      columns.push({
        outerHeight: 0,
        $column,
      });
      $masonry.appendChild($column);
    }

    let incomplete = false;
    $cells.forEach(($cell) => {
      const minOuterHeight = Math.min(...columns.map((column) => column.outerHeight));
      const column = columns.find((col) => col.outerHeight === minOuterHeight);
      column.$column.append($cell);

      const $image = $cell.querySelector('img');
      if ($image) {
        if (!$image.complete) {
          incomplete = true;
        }
      }
      const $video = $cell.querySelector('video');
      if ($video) {
        // console.log(`video ready state ${$video.readyState}`);
        if ($video.readyState === 0) {
          incomplete = true;
        }
      }

      // console.log(`cell offset height: ${$cell.offsetHeight}`);
      column.outerHeight += $cell.offsetHeight;
    });

    if (incomplete) {
      // console.log ('incomplete retrying in 500ms');

      setTimeout(() => {
        masonrize($cells, $masonry, true);
      }, 500);
    }
  }
}

const $fsmContainer = document.createElement('div');
$fsmContainer.setAttribute('id', 'fsmContainer');
document.body.appendChild($fsmContainer);
$fsmContainer.style.position = "absolute";

let position = {};
let size = {};

const maximize = (event) => {
  const $this = event.currentTarget.parentNode;
  const clientRect = $this.getBoundingClientRect();
  position = {
      top: $this.getBoundingClientRect().top - document.body.getBoundingClientRect().top,
      left: clientRect.left
  }

  size = {
    width: window.getComputedStyle($this).width,
    height: window.getComputedStyle($this).height
  }
  
  $fsmContainer.style.position = "absolute";
  $fsmContainer.style.top = position.top + 'px';
  $fsmContainer.style.left = position.left + 'px';
  $fsmContainer.style.height = size.height;
  $fsmContainer.style.width = size.width;
  $fsmContainer.style.margin = $this.style.margin;
  document.body.classList.add('no-scroll');
  
  setTimeout(() => {
    $fsmContainer.innerHTML = $this.innerHTML;
    $fsmContainer.classList.add('growing');
    $fsmContainer.style.height = '100vh';
    $fsmContainer.style.width = '100vw';
    $fsmContainer.style.top = window.pageYOffset + 'px';
    $fsmContainer.style.left = '0';
    $fsmContainer.style.margin = '0';
  }, 1);
  
  setTimeout(function(){
    const newHeight = window.getComputedStyle($fsmContainer.firstChild).height;
    let top = (window.innerHeight - newHeight.slice(0, -2)) / 2;
    top = top > 0 ? top : 0;
    $fsmContainer.style['padding-top'] = top + 'px';

    $fsmContainer.classList.remove('growing');
    $fsmContainer.classList.add('full-screen');
  }, 1000);
};


const reduce = (event) => {
  const $this = event.currentTarget;
  
  $this.style.height = size.height;
  $this.style.width = size.width;
  $this.style.top = position.top + 'px';
  $this.style.left = position.left + 'px';
  $this.style.margin = '0';
  $this.classList.remove('full-screen');
  $this.classList.add('shrinking');
  $fsmContainer.style['padding-top'] = '0';

  document.body.classList.remove('no-scroll');
  
  setTimeout(() => {
    while($this.firstChild) $this.removeChild($this.firstChild);
    const classList = $this.classList;
    while (classList.length > 0) {
       classList.remove(classList.item(0));
    }
    $this.style = '';

  }, 1000);
};

function getCarouselState($block) {
  const platform = $block.querySelector('.carousel-platform');
  const blockStyle = window.getComputedStyle($block);
  const platformStyle = window.getComputedStyle(platform);
  const blockWidth = parseInt(blockStyle.getPropertyValue('width'), 10);
  const platformWidth = parseInt(platformStyle.getPropertyValue('width'), 10);
  const platformLeft = parseInt(platformStyle.getPropertyValue('left'), 10) || 0;
  return {
    platform,
    platformLeft,
    blockWidth,
    platformWidth,
    platformOffset: platformWidth - blockWidth - Math.abs(platformLeft),
    faderLeft: $block.querySelector('.carousel-fader-left'),
    faderRight: $block.querySelector('.carousel-fader-right'),
  };
}

function toggleControls($block, newLeft = 0) {
  const state = getCarouselState($block);
  state.faderLeft.style.display = newLeft < 0 ? 'block' : 'none';
  state.faderRight.style.display = state.blockWidth < state.platformWidth - Math.abs(newLeft) ? 'block' : 'none';
}

function moveCarousel($block, increment) {
  const state = getCarouselState($block);
  let newLeft = state.platformLeft;
  if (increment < 0
      && state.platformWidth > state.blockWidth
      && state.platformOffset - Math.abs(increment) <= 0) {
    // near right end
    // eslint-disable-next-line no-param-reassign
    newLeft += -(state.platformOffset);
  } else if (increment > 0 && Math.abs(state.platformLeft) < increment) {
    // near left end
    // eslint-disable-next-line no-param-reassign
    newLeft += Math.abs(state.platformLeft);
  } else {
    newLeft += increment;
  }
  state.platform.style.left = `${newLeft}px`;
  // update carousel controls
  toggleControls($block, newLeft);
}

function buildCarousel($block) {
  // add items to carousel
  const $platform = createTag('div', { class: 'carousel-platform' });
  Array.from($block.children).forEach((t) => $platform.appendChild(t));
  $block.appendChild($platform);
  // faders
  const $faderLeft = createTag('div', { class: 'carousel-fader-left' });
  // $faderLeft.style.display = 'none';
  const $faderRight = createTag('div', { class: 'carousel-fader-right' });
  $block.appendChild($faderLeft);
  $block.appendChild($faderRight);
  // controls
  const $arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
  const $arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });
  $arrowLeft.addEventListener('click', () => moveCarousel($block, 240));
  $arrowRight.addEventListener('click', () => moveCarousel($block, -240));
  $faderLeft.appendChild($arrowLeft);
  $faderRight.appendChild($arrowRight);
  const media = Array.from($block.querySelectorAll('img, video'));
  const mediaLoaded = [];
  const mediaCheck = window.setInterval(() => {
    if (media.length === 0) {
      // all media loaded
      window.clearInterval(mediaCheck);
      toggleControls($block);
    }
    media.forEach(($m, i) => {
      if (parseInt(window.getComputedStyle($m).getPropertyValue('width'), 10)) {
        // non-zwero width, media loaded
        mediaLoaded.push(i);
        media.splice(i, 1);
      }
    });
  }, 50);
  window.addEventListener('resize', () => toggleControls($block));
}

export async function decorateItemList($block) {
  let rows = $block.children.length;

  if (rows > 6 && !$block.classList.contains('horizontal')) {
    $block.classList.add('masonry');
  }

  if (rows === 1) {
    $block.classList.add('large');
  }

  // find the edit link and turn the item DIV into the A
  // A
  // +- DIV
  //    +- PICTURE
  // +- DIV
  //    +- SPAN
  //       +- "Edit this item"
  //
  // make copy of children to avoid modifying list while looping
  for (let $tmplt of Array.from($block.children)) {
    const $link = $tmplt.querySelector(':scope > div:last-of-type > a');
    if ($link) {
      const $a = createTag('a', {
        href: $link.href || '#',
      });
      $a.append(...$tmplt.childNodes);
      $tmplt.remove();
      $tmplt = $a;
      $block.append($a);

      // convert A to SPAN
      const $newLink = createTag('span', { class: 'item-link' });
      $newLink.append(...$link.childNodes);
      $link.parentNode.append($newLink);
      $link.remove();
    }
    if (!$tmplt.querySelectorAll(':scope > div > *').length) {
      // remove empty row
      $tmplt.remove();
    }
    $tmplt.classList.add('item');
  }

  if ($block.classList.contains('horizontal')) {
    /* carousel */
    buildCarousel($block);
  } else if (rows > 6) {
    /* flex masonry */
    // console.log(`masonry-rows: ${rows}`);
    const $masonryCells = Array.from($block.children);
    $block.classList.remove('masonry');
    $block.classList.add('flex-masonry');
    masonrize($masonryCells, $block);
    window.addEventListener('resize', () => {
      masonrize($masonryCells, $block);
    });
  }
}

class Carousel extends HTMLElement {
  constructor() {
    super();
    decorateItemList(this);

    const $pictures = this.querySelectorAll('picture');;
    for (let i = 0; i < $pictures.length; i++) {
      const pic = $pictures[i];
      pic.addEventListener('click', maximize);
    }
    $fsmContainer.addEventListener('click', reduce);
  }
}

customElements.define('helix-carousel', Carousel);