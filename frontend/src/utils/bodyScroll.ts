let count = 0;

export function lockBody() {
  if (count === 0) document.body.classList.add('modal-open');
  count++;
}

export function unlockBody() {
  count = Math.max(0, count - 1);
  if (count === 0) document.body.classList.remove('modal-open');
}
