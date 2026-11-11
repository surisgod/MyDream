import { parsePhotos } from '../../utils/photos.js';
import { photoImgAttrs } from '../../services/photoUrls.js';

export function renderPhotoCarousel(note) {
  const photos = parsePhotos(note.photo_url);
  if (!photos.length) return '';

  if (photos.length === 1) {
    return `
      <div class="my-2">
        <img ${photoImgAttrs(photos[0])} data-action="openImageModal" data-note-id="${note.id}" data-index="0" title="Нажмите, чтобы увеличить" class="rounded-xl max-h-80 w-auto max-w-full object-contain bg-slate-950 border border-slate-800 shadow-md cursor-pointer hover:opacity-90 transition">
      </div>
    `;
  }

  return `
    <div class="my-2 relative">
      <div class="carousel-scroll flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain no-scrollbar rounded-xl border border-slate-800 bg-slate-950">
        ${photos.map((p, i) => `
          <div class="shrink-0 w-full snap-center flex justify-center">
            <img ${photoImgAttrs(p)} loading="lazy" data-action="openImageModal" data-note-id="${note.id}" data-index="${i}" class="max-h-80 w-auto max-w-full object-contain cursor-pointer">
          </div>
        `).join('')}
      </div>
      <span class="carousel-counter absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full pointer-events-none">1 / ${photos.length}</span>
      <button data-action="scrollCarousel" data-dir="-1" class="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition">‹</button>
      <button data-action="scrollCarousel" data-dir="1" class="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition">›</button>
    </div>
  `;
}

export function onCarouselScroll(el) {
  const idx = Math.round(el.scrollLeft / el.clientWidth);
  const counter = el.parentElement.querySelector('.carousel-counter');
  if (counter) counter.textContent = `${Math.min(idx + 1, el.children.length)} / ${el.children.length}`;
}

export function scrollCarousel(btn, dir) {
  const scroller = btn.parentElement.querySelector('.carousel-scroll');
  scroller.scrollBy({ left: dir * scroller.clientWidth, behavior: 'smooth' });
}

// событие scroll не всплывает, поэтому слушаем его на capture-фазе
export function initCarousel() {
  document.addEventListener('scroll', (e) => {
    if (e.target.classList && e.target.classList.contains('carousel-scroll')) onCarouselScroll(e.target);
  }, true);
}

export const actions = {
  scrollCarousel: (el) => scrollCarousel(el, Number(el.dataset.dir)),
};
