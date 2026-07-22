export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const container = document.getElementById('sr-announcer') || createAnnouncerContainer();
  container.setAttribute('aria-live', priority);
  container.textContent = message;
};

const createAnnouncerContainer = () => {
  const el = document.createElement('div');
  el.id = 'sr-announcer';
  el.className = 'sr-only';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  document.body.appendChild(el);
  return el;
};
