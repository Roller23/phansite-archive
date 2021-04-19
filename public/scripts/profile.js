(() => {
  const $ = selector => document.querySelector(selector);
  const $All = selector => document.querySelectorAll(selector);

  $All('.category').forEach(category => {
    category.addEventListener('click', () => {
      $All('.category').forEach(c => c.classList.remove('selected'));
      category.classList.add('selected');
      const cat = category.getAttribute('category');

      $All('.left-right-wrapper [category]').forEach(wrap => wrap.style.display = 'none');
      $(`.left-right-wrapper [category='${cat}']`).style.display = 'block';
    });
  });
})();