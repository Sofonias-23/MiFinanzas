'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { getReceiptImageUrl } from '@/lib/receipts';
import { supabase } from '@/lib/supabase';

type ReceiptRow = {
  id: string;
  created_by: string;
  household_id: string | null;
  payer_id: string;
  scope: 'personal' | 'pareja';
  image_path: string;
  merchant_name: string | null;
  merchant_tax_id: string | null;
  document_type: 'boleta' | 'factura' | 'ticket' | 'recibo' | 'otro' | null;
  document_number: string | null;
  issued_at: string | null;
  total_amount: number | null;
  payment_method: string | null;
  status: string;
};

type PaymentRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

type CategoryRow = {
  slug: string;
  name: string;
};

type ReceiptItem = {
  id: string;
  line_number: number;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  category: string | null;
  confidence: number | null;
};

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

const DOCUMENT_TYPES = ['boleta', 'factura', 'ticket', 'recibo', 'otro'] as const;

function dateInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function ComprobanteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiptId = searchParams.get('id');

  const [user, setUser] = useState<User | null>(null);
  const [receipt, setReceipt] = useState<ReceiptRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('Tu pareja');
  const [imageUrl, setImageUrl] = useState('');

  const [merchant, setMerchant] = useState('');
  const [taxId, setTaxId] = useState('');
  const [documentType, setDocumentType] = useState<ReceiptRow['document_type']>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [total, setTotal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [scope, setScope] = useState<'personal' | 'pareja'>('personal');
  const [payerId, setPayerId] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (!receiptId) {
      setErrorMessage('Falta el identificador del comprobante.');
      setLoading(false);
      return;
    }

    const [receiptResult, paymentResult, categoryResult, itemResult, statusResult] = await Promise.all([
      supabase
        .from('receipts')
        .select(
          'id, created_by, household_id, payer_id, scope, image_path, merchant_name, merchant_tax_id, document_type, document_number, issued_at, total_amount, payment_method, status',
        )
        .eq('id', receiptId)
        .maybeSingle(),
      supabase
        .from('payment_methods')
        .select('id, slug, name, icon')
        .order('created_at', { ascending: true }),
      supabase
        .from('expense_categories')
        .select('slug, name')
        .order('created_at', { ascending: true }),
      supabase
        .from('receipt_items')
        .select('id, line_number, description, quantity, unit_price, line_total, category, confidence')
        .eq('receipt_id', receiptId)
        .order('line_number', { ascending: true }),
      supabase.rpc('get_partner_status'),
    ]);

    if (receiptResult.error || !receiptResult.data) {
      setErrorMessage(receiptResult.error?.message || 'No se encontró el comprobante.');
      setLoading(false);
      return;
    }

    const next = receiptResult.data as ReceiptRow;
    const status = (statusResult.data?.[0] ?? null) as PartnerStatus | null;

    setUser(currentUser);
    setReceipt(next);
    setPayments((paymentResult.data ?? []) as PaymentRow[]);
    setCategories((categoryResult.data ?? []) as CategoryRow[]);
    setItems(
      ((itemResult.data ?? []) as ReceiptItem[]).map((item) => ({
        ...item,
        quantity: item.quantity == null ? null : Number(item.quantity),
        unit_price: item.unit_price == null ? null : Number(item.unit_price),
        line_total: item.line_total == null ? null : Number(item.line_total),
        confidence: item.confidence == null ? null : Number(item.confidence),
      })),
    );
    setPartnerStatus(status);
    setPartnerName(status?.partner_name || 'Tu pareja');

    setMerchant(next.merchant_name ?? '');
    setTaxId(next.merchant_tax_id ?? '');
    setDocumentType(next.document_type);
    setDocumentNumber(next.document_number ?? '');
    setIssuedDate(dateInputValue(next.issued_at));
    setTotal(next.total_amount == null ? '' : Number(next.total_amount).toFixed(2));
    setPaymentMethod(next.payment_method ?? '');
    setScope(next.scope);
    setPayerId(next.payer_id || currentUser.id);

    const signedUrl = await getReceiptImageUrl(next.image_path);
    setImageUrl(signedUrl || '');

    if (status?.household_id && (status.member_count ?? 0) >= 2) {
      const { data: member } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', status.household_id)
        .neq('user_id', currentUser.id)
        .limit(1)
        .maybeSingle();

      setPartnerId(member?.user_id ?? null);
    } else {
      setPartnerId(null);
    }

    setLoading(false);
  }, [receiptId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  function chooseScope(next: 'personal' | 'pareja') {
    if (!user) return;

    if (next === 'pareja') {
      const linked =
        (partnerStatus?.member_count ?? 0) >= 2 && Boolean(partnerStatus?.household_id);

      if (!linked) {
        setErrorMessage('Primero vincula a tu pareja.');
        return;
      }
    }

    setErrorMessage('');
    setScope(next);
    if (next === 'personal') setPayerId(user.id);
  }

  async function analyzeWithAI() {
    if (!user || !receipt) return;

    if (receipt.created_by !== user.id) {
      setErrorMessage('Solo quien subió el comprobante puede analizarlo.');
      return;
    }

    setAnalyzing(true);
    setErrorMessage('');
    setSavedMessage('');

    const { data, error } = await supabase.functions.invoke('analyze-receipt', {
      body: { receiptId: receipt.id },
    });

    setAnalyzing(false);

    if (error) {
      let message = error.message || 'No se pudo analizar el comprobante.';
      const context = (error as any)?.context;
      if (context) {
        try {
          const body = await context.json();
          if (body?.error) message = body.error;
        } catch {
          // Keep original error.
        }
      }
      setErrorMessage(message);
      return;
    }

    setSavedMessage(
      data?.itemCount
        ? `IA completada: se detectaron ${data.itemCount} producto(s). Revisa y corrige lo necesario.`
        : 'IA completada. Revisa y corrige los datos antes de guardar.',
    );
    await load();
  }

  async function saveReview() {
    if (!user || !receipt) return;

    if (receipt.created_by !== user.id) {
      setErrorMessage('Solo quien subió el comprobante puede editarlo.');
      return;
    }

    const parsedTotal = total.trim() ? Number(total.replace(',', '.')) : null;
    if (parsedTotal != null && (!Number.isFinite(parsedTotal) || parsedTotal < 0)) {
      setErrorMessage('Revisa el total del comprobante.');
      return;
    }

    if (scope === 'pareja' && !partnerStatus?.household_id) {
      setErrorMessage('Primero vincula a tu pareja.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSavedMessage('');

    const issuedAt = issuedDate
      ? new Date(issuedDate + 'T12:00:00').toISOString()
      : null;

    const { error } = await supabase
      .from('receipts')
      .update({
        merchant_name: merchant.trim() || null,
        merchant_tax_id: taxId.trim() || null,
        document_type: documentType,
        document_number: documentNumber.trim() || null,
        issued_at: issuedAt,
        total_amount: parsedTotal,
        payment_method: paymentMethod || null,
        scope,
        household_id: scope === 'pareja' ? partnerStatus?.household_id ?? null : null,
        payer_id: scope === 'pareja' ? payerId || user.id : user.id,
        status: 'revisado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', receipt.id)
      .eq('created_by', user.id);

    if (error) {
      setSaving(false);
      setErrorMessage(error.message || 'No se pudo guardar la revisión.');
      return;
    }

    const { data: finalizeData, error: finalizeError } = await supabase.rpc('finalize_receipt', {
      p_receipt_id: receipt.id,
    });

    setSaving(false);

    if (finalizeError) {
      setErrorMessage(finalizeError.message || 'No se pudo registrar el gasto.');
      return;
    }

    const result = Array.isArray(finalizeData) ? finalizeData[0] : finalizeData;
    const expenseCount = Number(result?.expense_count ?? 0);
    const registeredTotal = Number(result?.registered_total ?? parsedTotal ?? 0);

    setSavedMessage(
      expenseCount > 1
        ? `Se registraron ${expenseCount} movimientos por S/ ${registeredTotal.toFixed(2)}.`
        : `Gasto registrado por S/ ${registeredTotal.toFixed(2)}.`,
    );

    const expenseMonth = issuedDate
      ? issuedDate.slice(0, 7) + '-01'
      : new Date().getFullYear() +
        '-' +
        String(new Date().getMonth() + 1).padStart(2, '0') +
        '-01';

    setTimeout(() => {
      router.replace(
        scope === 'pareja'
          ? '/pareja?month=' + expenseMonth
          : '/dashboard?month=' + expenseMonth,
      );
    }, 900);
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando comprobante...</p>
      </main>
    );
  }

  if (!receipt) {
    return (
      <main className="dashboardLoading">
        <p>{errorMessage || 'No se pudo cargar el comprobante.'}</p>
      </main>
    );
  }

  const editable = receipt.created_by === user.id;

  return (
    <main className="receiptReviewPage">
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

      <section className="receiptReviewLayout">
        <aside className="receiptImagePanel">
          <p className="eyebrow">COMPROBANTE</p>
          <h1>Revisa antes de registrar.</h1>

          {imageUrl ? (
            <div className="receiptStoredPreview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Comprobante guardado" />
            </div>
          ) : (
            <div className="receiptStoredFallback">🧾</div>
          )}

          <div className="receiptInfoCard">
            <b>Lectura automática con IA</b>
            <span>
              Analiza comercio, RUC, fecha, total, método de pago, productos y categorías. Los resultados siempre quedan sujetos a revisión.
            </span>
            {editable && receipt.status !== 'procesado' ? (
              <button
                className="receiptAiButton"
                type="button"
                onClick={() => void analyzeWithAI()}
                disabled={analyzing}
              >
                {analyzing ? 'Analizando comprobante...' : items.length ? '↻ Analizar nuevamente' : '✦ Analizar con IA'}
              </button>
            ) : null}
          </div>
        </aside>

        <section className="receiptReviewForm">
          <div className="receiptFormHeader">
            <div>
              <p className="eyebrow">REVISIÓN</p>
              <h2>Datos del comprobante</h2>
            </div>
            <span className="receiptStatus">
              {receipt.status === 'procesado'
                ? 'Registrado'
                : receipt.status === 'revisado'
                ? 'Revisado'
                : 'Pendiente'}
            </span>
          </div>

          <div className="receiptField">
            <span>Destino</span>
            <div className="receiptScopeSelector compact">
              <button
                type="button"
                className={scope === 'personal' ? 'receiptScope active' : 'receiptScope'}
                onClick={() => chooseScope('personal')}
                disabled={!editable}
              >
                🔒 Personal
              </button>
              <button
                type="button"
                className={scope === 'pareja' ? 'receiptScope active pink' : 'receiptScope'}
                onClick={() => chooseScope('pareja')}
                disabled={!editable}
              >
                ♥ Pareja
              </button>
            </div>
          </div>

          <div className="receiptField">
            <label htmlFor="merchant">Comercio</label>
            <input
              id="merchant"
              value={merchant}
              onChange={(event) => setMerchant(event.target.value)}
              placeholder="Ej. Tottus, Metro, Primax..."
              disabled={!editable}
            />
          </div>

          <div className="receiptTwoColumns">
            <div className="receiptField">
              <label htmlFor="taxId">RUC</label>
              <input
                id="taxId"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                placeholder="Opcional"
                disabled={!editable}
              />
            </div>
            <div className="receiptField">
              <label htmlFor="documentNumber">N.º comprobante</label>
              <input
                id="documentNumber"
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                placeholder="Opcional"
                disabled={!editable}
              />
            </div>
          </div>

          <div className="receiptField">
            <span>Tipo de comprobante</span>
            <div className="receiptTypeChips">
              {DOCUMENT_TYPES.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={documentType === item ? 'active' : ''}
                  onClick={() => setDocumentType(item)}
                  disabled={!editable}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="receiptTwoColumns">
            <div className="receiptField">
              <label htmlFor="issuedDate">Fecha</label>
              <input
                id="issuedDate"
                type="date"
                value={issuedDate}
                onChange={(event) => setIssuedDate(event.target.value)}
                disabled={!editable}
              />
            </div>
            <div className="receiptField">
              <label htmlFor="total">Total</label>
              <input
                id="total"
                type="text"
                inputMode="decimal"
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                placeholder="0.00"
                disabled={!editable}
              />
            </div>
          </div>

          <div className="receiptField">
            <span>Método de pago</span>
            <div className="receiptPaymentGrid">
              {payments.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={paymentMethod === item.slug ? 'active' : ''}
                  onClick={() => setPaymentMethod(item.slug)}
                  disabled={!editable}
                >
                  <span>{item.icon || '💳'}</span>
                  <b>{item.name}</b>
                </button>
              ))}
            </div>
          </div>

          {scope === 'pareja' ? (
            <div className="receiptField">
              <span>¿Quién pagó?</span>
              <div className="receiptPayerGrid">
                <button
                  type="button"
                  className={payerId === user.id ? 'active' : ''}
                  onClick={() => setPayerId(user.id)}
                  disabled={!editable}
                >
                  Tú
                </button>
                <button
                  type="button"
                  className={payerId === partnerId ? 'active pink' : ''}
                  onClick={() => partnerId && setPayerId(partnerId)}
                  disabled={!editable || !partnerId}
                >
                  {partnerName}
                </button>
              </div>
            </div>
          ) : null}

          <div className="receiptItemsPlaceholder">
            <b>Productos del comprobante {items.length ? `(${items.length})` : ''}</b>
            {items.length ? (
              <div className="receiptDetectedItems">
                {items.map((item) => {
                  const categoryName =
                    categories.find((category) => category.slug === item.category)?.name ||
                    item.category ||
                    'Sin categoría';
                  const amount =
                    item.line_total != null
                      ? 'S/ ' + item.line_total.toFixed(2)
                      : item.unit_price != null
                      ? 'S/ ' + item.unit_price.toFixed(2)
                      : '—';

                  return (
                    <div className="receiptDetectedItem" key={item.id}>
                      <div>
                        <b>{item.description}</b>
                        <small>
                          {item.quantity != null ? 'Cant. ' + item.quantity + ' · ' : ''}
                          {categoryName}
                          {item.confidence != null
                            ? ' · ' + Math.round(item.confidence * 100) + '% confianza'
                            : ''}
                        </small>
                      </div>
                      <strong>{amount}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span>Aún no hay productos detectados. Pulsa “Analizar con IA”.</span>
            )}
          </div>

          {errorMessage ? <p className="formError">{errorMessage}</p> : null}
          {savedMessage ? <p className="receiptSavedMessage">{savedMessage}</p> : null}

          {editable && receipt.status !== 'procesado' ? (
            <button
              className="primaryButton receiptSaveButton"
              type="button"
              onClick={() => void saveReview()}
              disabled={saving}
            >
              {saving ? 'Registrando...' : 'Guardar y registrar gasto'}
            </button>
          ) : receipt.status === 'procesado' ? (
            <div className="receiptRegisteredCard">
              <b>✓ Comprobante registrado</b>
              <span>Este comprobante ya fue convertido en movimiento(s).</span>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default function ComprobantePage() {
  return (
    <Suspense fallback={<main className="dashboardLoading"><p>Cargando comprobante...</p></main>}>
      <ComprobanteContent />
    </Suspense>
  );
}
