import { state } from '../../state.js';
import { parsePhotos } from '../../utils/photos.js';

export function openImageModal(noteId, index) {
  const note = state.allNotes.find(n => n.id === noteId);
  if (!note) return;
  const photos = parsePhotos(note.photo_url);
  if (!photos.length) return;

  const scroller = document.getElementById('viewerScroller');
  scroller.innerHTML = photos.map(p => `
    <div class="shrink-0 w-full h-full snap-center flex items-center justify-center p-4" data-action="closeImageModalOnBackdrop">
      <img src="${p.url}" class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800">
    </div>
  `).join('');

  document.getElementById('imageModal').classList.remove('hidden');
  scroller.scrollTo({ left: (index || 0) * scroller.clientWidth, behavior: 'auto' });
  onViewerScroll();
}

export function onViewerScroll() {
  const scroller = document.getElementById('viewerScroller');
  const counter = document.getElementById('viewerCounter');
  const total = scroller.children.length;
  if (total < 2) { counter.classList.add('hidden'); return; }
  const idx = Math.round(scroller.scrollLeft / scroller.clientWidth);
  counter.textContent = `${Math.min(idx + 1, total)} / ${total}`;
  counter.classList.remove('hidden');
}

export function closeImageModal() {
  document.getElementById('imageModal').classList.add('hidden');
  document.getElementById('viewerScroller').innerHTML = '';
}

export function initImageViewer() {
  document.getElementById('viewerScroller').addEventListener('scroll', onViewerScroll);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImageModal();
  });
}

export const actions = {
  openImageModal: (el) => openImageModal(Number(el.dataset.noteId), Number(el.dataset.index)),
  closeImageModal: () => closeImageModal(),
  // закрывает окно только при клике по самому фону, а не по картинке
  closeImageModalOnBackdrop: (el, event) => {
    if (event.target === el) closeImageModal();
  },
};
