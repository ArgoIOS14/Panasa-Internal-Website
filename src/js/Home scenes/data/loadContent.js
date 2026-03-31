export const loadContent = async () => {
  const dataUrl = window.STRAPI_URL || 'content/Home page/content.json';
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Failed to load content: ${response.status}`);
  return response.json();
};
