import { describe, expect, test } from 'bun:test';
import { BATAS_LEWATI_BYTE, hitungDimensiBaru, SISI_MAKS_FOTO } from './kompresFoto';

describe('hitungDimensiBaru', () => {
  test('di bawah batas: dimensi tetap', () => {
    expect(hitungDimensiBaru(800, 600)).toEqual([800, 600]);
    expect(hitungDimensiBaru(1920, 1080)).toEqual([1920, 1080]);
  });
  test('landscape 4000px → sisi 1920, rasio terjaga', () => {
    expect(hitungDimensiBaru(4000, 3000)).toEqual([1920, 1440]);
  });
  test('portrait 3000px → sisi 1920, rasio terjaga', () => {
    expect(hitungDimensiBaru(3000, 4000)).toEqual([1440, 1920]);
  });
  test('maks kustom dihormati', () => {
    expect(hitungDimensiBaru(4000, 3000, 960)).toEqual([960, 720]);
  });
  test('masukan tak valid dikembalikan apa adanya', () => {
    expect(hitungDimensiBaru(0, 100)).toEqual([0, 100]);
    expect(hitungDimensiBaru(-5, 100)).toEqual([-5, 100]);
  });
  test('konstanta batas wajar', () => {
    expect(SISI_MAKS_FOTO).toBe(1920);
    expect(BATAS_LEWATI_BYTE).toBe(600 * 1024);
  });
});
