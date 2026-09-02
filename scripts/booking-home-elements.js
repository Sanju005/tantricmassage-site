(function () {
  var revealItems = document.querySelectorAll('.hp-reveal');
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach(function (item) { revealObserver.observe(item); });

  var animateStat = function (element) {
    if (element.dataset.countAnimated === 'true') { return; }
    element.dataset.countAnimated = 'true';

    var startValue = Number(element.dataset.countFrom || 0);
    var endValue = Number(element.dataset.countTo || 0);
    var suffix = element.dataset.countSuffix || '';
    var duration = 3000;
    var startTime = performance.now();

    var step = function (now) {
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var currentValue = Math.round(startValue + (endValue - startValue) * eased);
      element.textContent = currentValue + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  var statEls = document.querySelectorAll('.hp-stat-value[data-count-to]');
  var statObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateStat(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.45 });
  statEls.forEach(function (item) { statObserver.observe(item); });

  var fills = document.querySelectorAll('.hp-guarantee-fill');
  var fillObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-filled');
      } else {
        entry.target.classList.remove('is-filled');
      }
    });
  }, { threshold: 0.45 });
  fills.forEach(function (item) { fillObserver.observe(item); });
})();
