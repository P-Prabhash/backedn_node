function formatPhotoUrl(req, rawUrl) {
  if (!rawUrl) return null;
  const str = String(rawUrl).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '0' || str === 'false') return null;

  // If already absolute URL (http:// or https://), return clean URL
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // Clean relative path (remove leading slashes or duplicate server prefix)
  let cleanPath = str.replace(/^\/+/, '');
  if (cleanPath.startsWith('gold_pawn_erp/backend/')) {
    cleanPath = cleanPath.substring('gold_pawn_erp/backend/'.length);
  } else if (cleanPath.startsWith('backend/')) {
    cleanPath = cleanPath.substring('backend/'.length);
  }

  cleanPath = cleanPath.replace(/^\/+/, '');

  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = 'uploads/' + cleanPath;
  }

  return cleanPath;
}

module.exports = {
  formatPhotoUrl
};
