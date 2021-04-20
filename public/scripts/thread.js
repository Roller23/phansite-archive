(async () => {
  const $ = selector => document.querySelector(selector);
  const $All = selector => document.querySelectorAll(selector);

  function youtube(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
		const match = url.href.match(regExp);
    if (!(match && match[2].length === 11)) return;
    const id = match[2];
    const thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    const img = document.createElement('img');
    img.classList.add('image');
    img.src = thumb;
    url.innerHTML = '';
    url.appendChild(img);
    function createIframe(e) {
      e.preventDefault();
      url.style.display = 'block';
      const iframe = document.createElement('iframe');
      const width = $('.content-container').scrollWidth - 80;
      const height = Math.floor(width * 0.5625);
      iframe.width = width + 'px';
      iframe.height = height + 'px';
      iframe.src = 'https://youtube.com/embed/' + id + '?autoplay=1';
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      url.innerHTML = '';
      url.appendChild(iframe);
      url.removeEventListener('click', createIframe);
      url.addEventListener('click', function(e) {
        e.preventDefault();
      })
    }
    url.addEventListener('click', createIframe);

    img.addEventListener('load', () => {
      url.style.display = 'table';
      const play = document.createElement('img');
      play.src = '/images/youtube_play.png';
      play.classList.add('youtube-play');
      url.appendChild(play);
    })
  }

  $All('span.image').forEach(image => {
    image.classList.remove('image');
    const link = document.createElement('a');
    link.href = image.getAttribute('image');
    image.innerHTML = '';
    image.appendChild(link);
  });

  $All('.content-container').forEach(content => {
    content.innerHTML = anchorme(content.innerHTML);
    content.querySelectorAll('a').forEach(a => {
      a.classList.add('link');
      a.setAttribute('target', '_blank');
    });
  });

  $All('.content-container .link').forEach(link => {
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

  $All('.content-container .link').forEach(youtube);

  $All('.reply-left .avatar, .likes-wrapper .avatar').forEach(avatar => {
    const image = new Image();
    const src = avatar.getAttribute('src-check');
    image.onload = () => avatar.src = src;
    image.onerror = () => {};
    image.src = src;
  });

  $All('spoiler').forEach(spoiler => {
    spoiler.addEventListener('click', () => spoiler.classList.add('clicked'));
  });

})();