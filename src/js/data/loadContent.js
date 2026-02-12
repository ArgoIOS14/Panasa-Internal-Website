export const loadContent = async () => {
  const dataUrl = window.STRAPI_URL || 'data/content.json';
  const response = await fetch(dataUrl);
  return response.json();
};
