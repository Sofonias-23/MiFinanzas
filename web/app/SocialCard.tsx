export default function SocialCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 78% 24%, rgba(94,71,255,.45), transparent 28%), radial-gradient(circle at 18% 78%, rgba(51,212,255,.20), transparent 30%), linear-gradient(135deg,#07101b 0%,#0a1425 48%,#0e1730 100%)',
        color: '#f8fbff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '68px 78px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          right: -110,
          top: -95,
          borderRadius: '50%',
          border: '1px solid rgba(136,177,255,.22)',
          boxShadow: '0 0 90px rgba(56,114,255,.18)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 270,
          height: 270,
          right: 35,
          top: 45,
          borderRadius: '50%',
          border: '1px solid rgba(136,177,255,.18)',
          display: 'flex',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 70,
              height: 76,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '18px 30px 18px 18px',
              background: 'linear-gradient(145deg,#33d4ff,#1f8cff 48%,#5e47ff)',
              boxShadow: '0 18px 55px rgba(31,140,255,.32)',
              fontSize: 42,
              fontWeight: 900,
            }}
          >
            $
          </div>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em' }}>SFIQ</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 66,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: '-0.055em',
            }}
          >
            Finanzas claras. Personales. Compartidas.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              color: '#a9bad0',
              fontSize: 25,
              lineHeight: 1.4,
            }}
          >
            Controla gastos, organiza tu presupuesto y divide gastos en pareja con una sola vista.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#88bfff', fontSize: 19 }}>
          <div style={{ display: 'flex' }}>sfiq.app</div>
          <div style={{ display: 'flex', width: 5, height: 5, borderRadius: '50%', background: '#5a7192' }} />
          <div style={{ display: 'flex', color: '#93a7c1' }}>Smart Financial Intelligence</div>
        </div>
      </div>
    </div>
  );
}
