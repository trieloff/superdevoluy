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
  createTag
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

export default class Carousel extends HTMLElement {
  constructor() {
    super();
    decorateItemList(this);

    const $style = document.createElement('style');
    $style.innerHTML = /* css */`
    main helix-carousel {
      max-width: 375px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      margin: 20px auto 0 auto;
      font-size: 1rem;
      font-weight: normal;
      text-align: left;
    }
    
    main helix-carousel .item-link {
      text-decoration: none;
      color: #1473E6;
      padding-left: 16px;
      padding-top: 6px;
      display: flex;
    }
    
    main helix-carousel .item-link::after {
      display: flex;
      width: 6px;
      height: 6px;
      border-top-width: 0;
      border-left-width: 0;
      border-bottom-width: 2px;
      border-right-width: 2px;
      border-style: solid;
      border-color: #5C5CE0;
      transform-origin: 75% 75%;
      transform: rotate( -45deg );
      content: "";
      margin-top: 5px;
      margin-left: 5px;
      margin-right: 2.25px;
    }
    
    main helix-carousel .item p {
      margin: 0;
    }
    
    main helix-carousel .item {
      display: flex;
      flex-direction: column;
      width: 240px;
      margin: 0 0 32px 0;
      justify-content: flex-end;
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
      break-inside: avoid;
      text-decoration: unset;
    }
    
    main helix-carousel .item > div:first-child > a:any-link {
      padding-left: 0;
    }
    
    main helix-carousel .item img, main helix-carousel .item video {
      border-radius: 10px;
      width: 300px;
    }
    
    main helix-carousel.large .item {
      width: 100%;
      margin: 0;
      border: 0;
    }
    
    main helix-carousel.large .item > div {
      margin: auto;
    }
    
    main helix-carousel.large .item img {
      width: 100%;
    }
    
    main helix-carousel + .button-container > a {
      margin: 0;
    }
    
    main helix-carousel.masonry {
      columns: 240px 1;
      max-width: 311px;
      margin-left: auto;
      margin-right: auto;
    }
    
    main helix-carousel.masonry .item {
      margin-top: 0;
      margin-bottom: 32px;
      padding: 0;
    }
    
    /* horizontal carousel (carousel) */
    
    main helix-carousel.horizontal {
      display: block;
      overflow: hidden;
      max-width: 375px;
      margin-left: auto; 
      margin-right: auto;
      height: 220px;
    }
    
    main helix-carousel.horizontal .carousel-platform {
      position: relative;
      width: fit-content;
      height: 220px;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      left: 0;
      transition: left 0.4s;
    }
    
    main helix-carousel.horizontal .carousel-fader-left {
      display: none;
      position: relative;
      height: 220px;
      width: 60px;
      top: -220px;
      float: left;
      background: linear-gradient(
        to left,
        rgba(255, 255, 255, 0),
        rgba(255, 255, 255, 1)
      );
      transition: display 0.2s;
    }
    
    main helix-carousel.horizontal .carousel-fader-right {
      display: none;
      position: relative;
      height: 220px;
      width: 68px;
      top: -220px;
      float: right;
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0),
        rgba(255, 255, 255, 1)
      );
      transition: display 0.2s;
    }
    
    main helix-carousel.horizontal a.button.carousel-arrow {
      cursor: pointer;
      display: block;
      float: left;
      width: 32px;
      height: 32px;
      margin: 100px 20px;
      background: #FFF;
      box-shadow: 0 4px 8px 2px rgba(102, 102, 102, 0.1);
      border-radius: 50%;
    }
    
    main helix-carousel.horizontal a.button.carousel-arrow::before {
      content: '';
      position: absolute;
      margin-top: 11px;
      width: 8px;
      height: 8px;
      border-top: solid 2px #444;
      border-right: solid 2px #444;
    }
    
    main helix-carousel.horizontal a.button.carousel-arrow-left::before {
      margin-left: 13px;
      transform: rotate(-135deg);
    }
    
    main helix-carousel.horizontal a.button.carousel-arrow-right {
      float: right;
    }
    
    main helix-carousel.horizontal a.button.carousel-arrow-right::before {
      margin-left: 9px;
      transform: rotate(45deg);
    }
    
    main helix-carousel.horizontal .item {
      min-height: 220px;
      max-height: 220px;
      width: max-content;
      margin-left: 12px;
      margin-right: 12px;
    }
    
    main helix-carousel.horizontal .item img,
    main helix-carousel.horizontal .item video {
      height: 200px;
      width: auto;
    }
    
    main helix-carousel.horizontal .item-link {
      display: none;
    }
    
    @media (min-width: 900px) {
      main .carousel-container > div,
      main .carousel-horizontal-container > div {
        max-width: 900px;
      }
    
      main helix-carousel {
        max-width: unset;    
      }
    
      main helix-carousel .item {
        width: 240px;
        margin-left: 20px;
        margin-right: 20px;
      }
    
      main helix-carousel .item img {
        width: 240px;
      }
    
      main helix-carousel.masonry {
        display: block;
        columns: 240px 3;
        margin-left: auto;
        margin-right: auto;
        max-width: 800px;
      }
    
      /* carousel inside columns */
    
      main .columns helix-carousel {
        margin-top: 0;
        margin-left: 40px;
      }
    
      /* horizontal carousel (carousel) */
    
      main helix-carousel.horizontal {
        max-width: 800px;
      }
    
      main helix-carousel.horizontal .carousel-fader-left,
      main helix-carousel.horizontal .carousel-fader-right {
        width: 150px;
      }
    }
    
    @media (min-width: 1200px) {
      main .carousel-container > div,
      main .carousel-horizontal-container > div {
        max-width: 1200px;
      }
    
      main helix-carousel.masonry {
        display: block;
        columns: 240px 4;
        margin: auto;
        column-gap: 40px;
        max-width: 1080px;
        position: relative;
        left: -16px;
      }
    
      /* carousel inside columns */
    
      main .columns helix-carousel {
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: flex-start;
      }
    
      main .columns helix-carousel .item {
        justify-content: flex-start;
        min-width: 132px;
      }
    
      main .columns helix-carousel .item-link {
        font-size: 0.875rem;
        font-weight: 400;
      }
    
      /* horizontal carousel (carousel) */
    
      main helix-carousel.horizontal {
        max-width: 1090px;
      }
    }
    
    body.no-scroll {
      overflow: hidden;
    }
    
    main helix-carousel .item > div, #fsmContainer {
      transition: 1s;
      text-align: center;
    }
    
    #fsmContainer.full-screen {
      height: 100vh;
      z-index: 100;
      margin: 0;
      border-radius: 0;
      background-color: lightgray;
    }
`;
    this.appendChild($style);

    const $pictures = this.querySelectorAll('picture');;
    for (let i = 0; i < $pictures.length; i++) {
      const pic = $pictures[i];
      pic.addEventListener('click', maximize);
    }
    $fsmContainer.addEventListener('click', reduce);
  }
}