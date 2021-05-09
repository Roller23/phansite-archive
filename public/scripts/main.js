(async () => {
  const $ = selector => document.querySelector(selector);
  const $All = selector => document.querySelectorAll(selector);

  $All('.thread-wrapper .avatar').forEach(avatar => {
    const image = new Image();
    const src = avatar.getAttribute('check-src');
    image.onload = () => avatar.src = src;
    image.onerror = () => {};
    image.src = src;
  });

  const search = query => {
    if (!query) {
      return window.location.href = '/'
    }
    if (query.length < 3) {
      return alert('Search query must be at least 3 characters');
    }
    if (query.length > 100) {
      return alert('Search query mustn\'t exceed 100 characters');
    }
    const type = $('#search-content').checked ? 'tc' : 't';
    window.location.href = `/search/${type}/${encodeURIComponent(query)}`;
  }

  $('.thread-search').addEventListener('keyup', function(e) {
    if (e.key.toLowerCase() !== 'enter') return;
    search(this.value);
  });

  $('.thread-search-btn').addEventListener('click', e => {
    search($('.thread-search').value);
  });
})();