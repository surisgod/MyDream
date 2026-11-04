// Шапка прячется при прокрутке вниз и возвращается при прокрутке вверх (без смещения контента)
export function initStickyHeader() {
  const mainHeader = document.getElementById('mainHeader');
  const headerSpacer = document.getElementById('headerSpacer');
  const headerTop = document.getElementById('headerTop');
  const scrollThreshold = 60;
  const scrollDelta = 8;
  let headerHidden = false;
  let hideOffset = 0;
  let lastScrollTop = 0;

  function applyHeaderTransform() {
    mainHeader.style.transform = headerHidden ? `translateY(-${hideOffset}px)` : 'translateY(0)';
  }

  function measureHeader() {
    headerSpacer.style.height = mainHeader.offsetHeight + 'px';
    hideOffset = headerTop.offsetHeight + 20;
    applyHeaderTransform();
  }

  measureHeader();
  new ResizeObserver(measureHeader).observe(mainHeader);
  window.addEventListener('resize', measureHeader);

  window.addEventListener('scroll', function() {
    const y = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);
    const dy = y - lastScrollTop;

    if (y <= 0) {
      headerHidden = false;
    } else if (Math.abs(dy) < scrollDelta) {
      return;
    } else if (dy > 0 && y > scrollThreshold) {
      headerHidden = true;
    } else if (dy < 0) {
      headerHidden = false;
    }

    lastScrollTop = y;
    applyHeaderTransform();
  }, { passive: true });
  
}
