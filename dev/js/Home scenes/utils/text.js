export const highlightWords = (text, wordsCount) => {
  const words = text.split(' ');
  const head = words.slice(0, wordsCount).join(' ');
  const tail = words.slice(wordsCount).join(' ');
  return `<span>${head}</span> ${tail}`.trim();
};
