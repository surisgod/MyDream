import { state } from '../../state.js';
import { MAX_PHOTOS, MAX_TOTAL_BYTES } from '../../config.js';
import { uploadPhoto } from '../../services/photoStorage.js';
import { formatMB } from '../../utils/text.js';

export function totalPhotoBytes() {
  return state.currentPhotos.reduce((sum, p) => sum + (p.size || 0), 0);
}

export async function handleImageUpload(event) {
  await addPhotoFiles(event.target.files);
  event.target.value = '';
}

export function handlePaste(event) {
  const items = (event.clipboardData || window.clipboardData).items;
  const files = [];
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const f = item.getAsFile();
      if (f) files.push(f);
    }
  }
  if (files.length) {
    event.preventDefault();
    addPhotoFiles(files);
  }
}

export async function addPhotoFiles(fileList) {
  const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
  if (!files.length || state.isUploading) return;

  state.isUploading = true;
  renderModalImage();
  const problems = new Set();

  for (const file of files) {
    if (state.currentPhotos.length >= MAX_PHOTOS) {
      problems.add(`В одной записи может быть не больше ${MAX_PHOTOS} фото.`);
      break;
    }
    if (totalPhotoBytes() + file.size > MAX_TOTAL_BYTES) {
      problems.add(`Не поместилось в лимит ${MAX_TOTAL_BYTES / 1048576} МБ на запись (${formatMB(file.size)} МБ).`);
      continue;
    }

    const { url, error } = await uploadPhoto(file);
    if (error) {
      console.error(error);
      problems.add('Ошибка при загрузке фото.');
      continue;
    }

    state.currentPhotos.push({ url, size: file.size });
    renderModalImage();
  }

  state.isUploading = false;
  renderModalImage();
  if (problems.size) alert(Array.from(problems).join('\n'));
}

export function renderModalImage() {
  const container = document.getElementById('modalImageContainer');
  const info = document.getElementById('photoInfo');
  const label = document.getElementById('photoLabel');
  const input = document.getElementById('photoFileInput');

  container.innerHTML = state.currentPhotos.length ? `
    <div class="grid grid-cols-4 gap-2 mb-1">
      ${state.currentPhotos.map((p, i) => `
        <div class="relative aspect-square">
          <img src="${p.url}" class="w-full h-full object-cover rounded-xl border border-slate-800">
          <button type="button" data-action="removePhoto" data-index="${i}" title="Убрать фото" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:bg-red-900 hover:text-white flex items-center justify-center transition">✕</button>
        </div>
      `).join('')}
    </div>
  ` : '';

  if (state.isUploading) {
    info.textContent = 'Загрузка…';
  } else if (state.currentPhotos.length) {
    info.textContent = `${state.currentPhotos.length}/${MAX_PHOTOS} фото · ${formatMB(totalPhotoBytes())} / ${MAX_TOTAL_BYTES / 1048576} МБ`;
  } else {
    info.textContent = `до ${MAX_PHOTOS} фото, всего до ${MAX_TOTAL_BYTES / 1048576} МБ · Ctrl+V`;
  }

  const locked = state.isUploading || state.currentPhotos.length >= MAX_PHOTOS;
  input.disabled = locked;
  label.classList.toggle('opacity-50', locked);
  label.classList.toggle('pointer-events-none', locked);
}

export function removePhoto(index) {
  state.currentPhotos.splice(index, 1);
  renderModalImage();
}

export function initPhotoUploader() {
  document.getElementById('photoFileInput').addEventListener('change', handleImageUpload);
  document.getElementById('modalText').addEventListener('paste', handlePaste);
}

export const actions = {
  removePhoto: (el) => removePhoto(Number(el.dataset.index)),
};
