import api from './client';

export async function uploadAdminMedia(file, folder = 'other') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder || 'other');
  const { data } = await api.post('/admin/media', fd);
  if (!data?.media?.url) throw new Error('Upload did not return a URL.');
  return data.media;
}
