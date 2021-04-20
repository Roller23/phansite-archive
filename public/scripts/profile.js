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

  $All('.about a').forEach(link => {
    const image = new Image();
    const src = link.getAttribute('href');
    image.onload = () => {
      const img = document.createElement('img');
      img.classList.add('image');
      img.src = src;
      link.innerHTML = '';
      link.appendChild(img);
    }
    image.onerror = () => {};
    image.src = src;
  });

})();