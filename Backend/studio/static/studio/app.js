/* WealthWise Studio — UI helpers (sidebar, modal, toasts, dark mode). */
window.Studio = (function () {
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
  }

  function toggleDark() {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('studio-dark', isDark ? 'true' : 'false');
  }

  function openModal(url) {
    const modal = document.getElementById('modal');
    fetch(url, { headers: { 'HX-Request': 'true' } })
      .then((r) => r.text())
      .then((html) => {
        modal.innerHTML = '<div class="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">' + html + '</div>';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      });
  }

  function openConfirm(url) {
    openModal(url);
  }

  function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.innerHTML = '';
  }

  function toast(message, kind) {
    const colors = {
      success: 'bg-emerald-600',
      error: 'bg-rose-600',
      info: 'bg-slate-800',
    };
    const el = document.createElement('div');
    el.className = 'rounded-lg px-4 py-2 text-sm text-white shadow-lg ' + (colors[kind] || colors.info);
    el.textContent = message;
    document.getElementById('toast').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // Close modal on backdrop click.
  document.addEventListener('click', function (e) {
    const modal = document.getElementById('modal');
    if (modal && e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  return { toggleSidebar, toggleDark, openModal, openConfirm, closeModal, toast };
})();
