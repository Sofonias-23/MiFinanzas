'use client';

import { ChangeEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createReceiptFromFile } from '@/lib/receipts';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  member_count: number;
};

function EscanearComprobanteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [scope, setScope] = useState<'personal' | 'pareja'>(
    searchParams.get('scope') === 'pareja' ? 'pareja' : 'personal',
  );
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const { data: statusData } = await supabase.rpc('get_partner_status');

      if (!active) return;
      setUser(currentUser);
      setPartnerStatus((statusData?.[0] ?? null) as PartnerStatus | null);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setErrorMessage('');

    if (!next) return;

    if (!next.type.startsWith('image/')) {
      setErrorMessage('Selecciona una imagen de la boleta, factura, ticket o recibo.');
      return;
    }

    if (next.size > 15 * 1024 * 1024) {
      setErrorMessage('La imagen debe pesar menos de 15 MB.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  async function continueToReview() {
    if (!user || !file) {
      setErrorMessage('Toma una foto o selecciona una imagen.');
      return;
    }

    if (scope === 'pareja') {
      const linked =
        (partnerStatus?.member_count ?? 0) >= 2 && Boolean(partnerStatus?.household_id);

      if (!linked) {
        setErrorMessage('Primero vincula a tu pareja para guardar un comprobante compartido.');
        return;
      }
    }

    try {
      setUploading(true);
      setErrorMessage('');

      const receiptId = await createReceiptFromFile({
        userId: user.id,
        file,
        scope,
        householdId: scope === 'pareja' ? partnerStatus?.household_id : null,
        payerId: user.id,
      });

      router.replace('/comprobante?id=' + receiptId);
    } catch (error: any) {
      setErrorMessage(error?.message || 'No se pudo guardar el comprobante.');
    } finally {
      setUploading(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando escáner...</p>
      </main>
    );
  }

  return (
    <main className="receiptScanPage">
      <header className="expenseTopbar">
        <a className="brand" href={scope === 'pareja' ? '/pareja' : '/dashboard'}>
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href={scope === 'pareja' ? '/pareja' : '/dashboard'}>
          ← Volver
        </a>
      </header>

      <section className="receiptScanLayout">
        <div className="receiptScanIntro">
          <p className="eyebrow">COMPROBANTES</p>
          <h1>Escanea una boleta o factura.</h1>
          <p>
            Fotografía el comprobante completo. SFIQ lo guardará de forma privada y te mostrará
            una revisión antes de registrar movimientos.
          </p>

          <div className="receiptScopeSelector">
            <button
              type="button"
              className={scope === 'personal' ? 'receiptScope active' : 'receiptScope'}
              onClick={() => setScope('personal')}
            >
              🔒 Personal
            </button>
            <button
              type="button"
              className={scope === 'pareja' ? 'receiptScope active pink' : 'receiptScope'}
              onClick={() => setScope('pareja')}
            >
              ♥ Pareja
            </button>
          </div>

          <div className="receiptInfoCard">
            <b>Compatible con distintos comercios</b>
            <span>
              Supermercados, grifos, restaurantes, farmacias, mercados, talleres, servicios y más.
            </span>
          </div>
        </div>

        <section className="receiptCapturePanel">
          {previewUrl ? (
            <div className="receiptPreviewWrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Vista previa del comprobante" className="receiptPreview" />
              <span>Comprueba que fecha, comercio, detalle y total sean legibles.</span>
            </div>
          ) : (
            <div className="receiptDropZone">
              <span className="receiptDropIcon">🧾</span>
              <b>Sube el comprobante completo</b>
              <p>Evita sombras, reflejos y bordes cortados.</p>
            </div>
          )}

          <div className="receiptFileActions">
            <label className="receiptFileButton primary">
              📷 Tomar foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
              />
            </label>

            <label className="receiptFileButton">
              🖼 Elegir imagen
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>
          </div>

          <div className="receiptNextStep">
            <b>Vista previa antes de registrar</b>
            <span>
              La lectura automática con IA se conectará a esta misma revisión. Primero dejamos lista
              la cámara, el almacenamiento privado y el formulario.
            </span>
          </div>

          {errorMessage ? <p className="formError">{errorMessage}</p> : null}

          <button
            className="primaryButton receiptContinueButton"
            type="button"
            onClick={() => void continueToReview()}
            disabled={!file || uploading}
          >
            {uploading ? 'Guardando...' : 'Continuar a revisión'}
          </button>
        </section>
      </section>
    </main>
  );
}

export default function EscanearComprobantePage() {
  return (
    <Suspense fallback={<main className="dashboardLoading"><p>Cargando escáner...</p></main>}>
      <EscanearComprobanteContent />
    </Suspense>
  );
}
