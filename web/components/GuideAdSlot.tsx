import AdSenseSlot from './AdSenseSlot';

export default function GuideAdSlot({ position = 'mid' }: { position?: 'mid' | 'end' }) {
  return (
    <AdSenseSlot
      slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDES}
      format="auto"
      className={`adSensePublic guideAdSlot guideAdSlot-${position}`}
    />
  );
}
