const Recommendation = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="fade-up rounded-xl border bg-white px-8 py-12 text-center" style={{ borderColor: 'var(--border)' }}>
        <div className="dot-pulse mb-4 flex justify-center gap-1">
          <span /><span /><span />
        </div>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Analysing uploaded policies against your profile…
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { peerComparison, coverageDetails, whyThisPolicy, sourcePolicies } = data;

  const hasPeers = Array.isArray(peerComparison) && peerComparison.length > 0;
  const hasCoverage =
    coverageDetails &&
    Object.values(coverageDetails).some((v) => v && v !== 'Not available');

  return (
    <div className="fade-up space-y-8">

      {/* ── Section header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--accent)' }}>
            Recommendation
          </p>
          <h2 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
            Your personalised policy analysis
          </h2>
        </div>
        {sourcePolicies && sourcePolicies.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1.5 justify-end">
            {sourcePolicies.map((p, i) => (
              <span key={i} className="badge">{p}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Peer Comparison Table ── */}
      <section className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3.5 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Peer Comparison</span>
          <span className="ml-auto text-xs" style={{ color: 'var(--ink-muted)' }}>Sourced from policy documents only</span>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr style={{ background: '#faf9f7', borderBottom: '1px solid var(--border)' }}>
                {['Policy', 'Insurer', 'Premium', 'Cover', 'Waiting', 'Key Benefit', 'Score'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasPeers ? (
                peerComparison.map((item, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-orange-50/50"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                      {item.policy_name ?? item.policyName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-muted)' }}>{item.insurer ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.premium ?? '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-muted)' }}>{item.cover ?? '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-muted)' }}>{item.waiting_period ?? item.waitingPeriod ?? '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-muted)' }}>{item.benefit ?? item.key_benefit ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: 'var(--accent-lt)', color: 'var(--accent)', border: '1px solid #fed7aa' }}
                      >
                        {item.score ?? item.suitability_score ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                    No structured comparison data extracted — see the explanation below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Coverage + Why — side-by-side on desktop ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Coverage Details — 2 cols */}
        <section className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Coverage Details</span>
          </div>
          <div className="divide-y" style={{ divideColor: 'var(--border)' }}>
            {[
              { label: 'Inclusions',  val: coverageDetails?.inclusions  ?? coverageDetails?.Inclusions  },
              { label: 'Exclusions',  val: coverageDetails?.exclusions  ?? coverageDetails?.Exclusions  },
              { label: 'Sub-limits',  val: coverageDetails?.sub_limits  ?? coverageDetails?.subLimits   },
              { label: 'Co-pay',      val: coverageDetails?.co_pay      ?? coverageDetails?.coPay       },
              { label: 'Claim type',  val: coverageDetails?.claim_type  ?? coverageDetails?.claimType   },
            ].map(({ label, val }) => (
              <div key={label} className="px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--ink-muted)' }}>{label}</p>
                <p className="text-sm" style={{ color: val && val !== 'Not available' ? 'var(--ink)' : 'var(--ink-muted)' }}>
                  {val && val !== 'Not available' ? val : 'Not specified in documents'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why This Policy — 3 cols */}
        <section className="lg:col-span-3 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Why this policy?</span>
          </div>
          <div className="px-5 py-5">
            {whyThisPolicy ? (
              <p className="text-sm leading-7 whitespace-pre-line" style={{ color: 'var(--ink)' }}>
                {whyThisPolicy}
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                The model did not return an explanation for this recommendation.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Source tags — mobile */}
      {sourcePolicies && sourcePolicies.length > 0 && (
        <div className="flex sm:hidden flex-wrap gap-1.5">
          {sourcePolicies.map((p, i) => (
            <span key={i} className="badge">{p}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendation;
