(() => {
  const $All = selector => document.querySelectorAll(selector);
  const timezone = moment.tz.guess();
  const serverTimezone = 'Europe/Warsaw';

  $All('[time]').forEach(time => {
    const date = time.getAttribute('time');
    if (!date) {
      return time.innerText = 'Unknown time';
    }
    const timestamp = date * 1000;
    const CEST = moment.tz(timestamp, serverTimezone);
    const formatted = moment.tz(CEST, timezone).format('lll');
    time.innerText = formatted;
  });
})();