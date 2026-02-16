export const loadContent = async () => {
  const dataUrl = window.STRAPI_URL || 'content/Home page/content.json';
  const response = await fetch(dataUrl);
  return response.json();
};
