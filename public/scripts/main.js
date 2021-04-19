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
})();