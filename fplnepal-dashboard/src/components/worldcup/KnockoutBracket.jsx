export default function KnockoutBracket({ rounds = {}, flag }) {
  const order = ['R16', 'QF', 'SF', 'Final'];

  return (
    <div className="overflow-x-auto pb-10 mb-12">
      <div className="min-w-[1000px] grid grid-cols-4 gap-10">
        {order.map((round) => (
          <div key={round}>
            <h3 className="text-xl font-bold text-center mb-6">
              {round}
            </h3>

            <div className="flex flex-col gap-8">
              {(rounds[round] || []).map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border shadow px-4 py-3"
                >
                  {/* Team 1 */}
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      m.winner === m.home
                        ? 'font-bold text-indigo-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {m.home?.iso2 && (
                      <img
                        src={flag(m.home.iso2)}
                        alt=""
                        className="w-5 h-3"
                      />
                    )}
                    <span>{m.home?.name || m.t1}</span>
                  </div>

                  {/* Score */}
                  <div className="text-center my-1 font-semibold">
                    {m.s1 !== null && m.s2 !== null
                      ? `${m.s1} – ${m.s2}`
                      : '—'}
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex items-center gap-2 text-sm justify-end ${
                      m.winner === m.away
                        ? 'font-bold text-indigo-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <span>{m.away?.name || m.t2}</span>
                    {m.away?.iso2 && (
                      <img
                        src={flag(m.away.iso2)}
                        alt=""
                        className="w-5 h-3"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
