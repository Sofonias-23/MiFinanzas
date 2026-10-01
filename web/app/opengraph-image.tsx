import { ImageResponse } from 'next/og';
import SocialCard from './SocialCard';

export const alt = 'SFIQ - Smart Financial Intelligence';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(<SocialCard />, size);
}
