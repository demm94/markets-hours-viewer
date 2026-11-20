import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { acquireBodyScrollLock, resetBodyScrollLockForTest } from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  const originalDocument = globalThis.document;
  let mockOverflow = '';

  beforeEach(() => {
    mockOverflow = '';
    globalThis.document = {
      body: {
        style: {
          get overflow() {
            return mockOverflow;
          },
          set overflow(value: string) {
            mockOverflow = value;
          }
        }
      }
    } as unknown as Document;
    resetBodyScrollLockForTest();
  });

  afterEach(() => {
    resetBodyScrollLockForTest();
    globalThis.document = originalDocument;
  });

  it('locks body scroll on acquire and restores empty overflow immediately on release', () => {
    const release = acquireBodyScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    release();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps body scroll locked until all overlapping overlays release their locks', () => {
    const releaseModal = acquireBodyScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    const releaseDrawer = acquireBodyScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    releaseModal();
    expect(document.body.style.overflow).toBe('hidden');

    releaseDrawer();
    expect(document.body.style.overflow).toBe('');
  });

  it('makes release functions idempotent so double release cannot unlock another active overlay', () => {
    const releaseFirst = acquireBodyScrollLock();
    const releaseSecond = acquireBodyScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    releaseFirst();
    releaseFirst();
    expect(document.body.style.overflow).toBe('hidden');

    releaseSecond();
    expect(document.body.style.overflow).toBe('');
  });

  it('preserves pre-existing non-empty body overflow value after the last lock releases', () => {
    document.body.style.overflow = 'auto';

    const releaseFirst = acquireBodyScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    const releaseSecond = acquireBodyScrollLock();
    releaseFirst();
    expect(document.body.style.overflow).toBe('hidden');

    releaseSecond();
    expect(document.body.style.overflow).toBe('auto');
  });
});
