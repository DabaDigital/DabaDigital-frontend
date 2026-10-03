import { describe, expect, it } from 'vitest';

import { isStorageImage, storageImage, storageSrcset } from './storage-image';

const COVER = 'https://abc.supabase.co/storage/v1/object/public/dd-project-images/projects/x.png';

describe('storage images', () => {
  it('serves a Storage object through the transformation endpoint, scaled to the asked width', () => {
    expect(storageImage(COVER, 640)).toBe(
      'https://abc.supabase.co/storage/v1/render/image/public/dd-project-images/projects/x.png?width=640&quality=70&resize=contain',
    );
  });

  it('lists one candidate per width', () => {
    expect(storageSrcset(COVER, [480, 960])).toBe(
      `${storageImage(COVER, 480)} 480w, ${storageImage(COVER, 960)} 960w`,
    );
  });

  it('leaves every other URL alone', () => {
    expect(isStorageImage('/images/team/keltoum-malouki.webp')).toBe(false);
    expect(storageImage('/images/team/keltoum-malouki.webp', 640)).toBe(
      '/images/team/keltoum-malouki.webp',
    );
    expect(storageSrcset('/images/team/keltoum-malouki.webp', [640])).toBeNull();
  });
});
