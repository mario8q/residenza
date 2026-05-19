import useAppStore from '../store/appStore';
import { useToast } from '../components/ui/Toast';
import { generarRecibo, exportarCSV } from '../utils/pdf';

export default function Reportes() {
  const s = useAppStore();
  const toast = useToast();

  const doExport = () => {
    exportarCSV(s.pagos, s.formatMes);
    toast.success('Reporte exportado como CSV.');
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historial de Pagos</span>

          <button
            className="card-action"
            onClick={doExport}
          >
            Exportar →
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Apartamento</th>
                <th>Residente</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Medio</th>
                <th>Recibo</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {s.pagos.map((p) => (
                <tr key={p.id}>
                  <td className="text-muted">
                    {s.formatFecha(p.fecha)}
                  </td>

                  <td>
                    <span className="apto-code">
                      {p.apto}
                    </span>
                  </td>

                  <td>{p.residente}</td>

                  <td
                    style={{
                      fontSize: '.8rem',
                      color: 'var(--text2)',
                    }}
                  >
                    Cuota admin. {s.formatMes(p.mes)}
                  </td>

                  <td
                    style={{
                      color: 'var(--accent2)',
                      fontWeight: 600,
                    }}
                  >
                    {s.formatMoney(p.monto)}
                  </td>

                  <td className="text-muted">
                    {p.medio}
                  </td>

                  <td>
                    <span className="badge badge-green">
                      {p.recibo}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const pago = s.pagos.find(
                          (x) => x.id === p.id
                        );

                        if (pago) {
                          generarRecibo(
                            pago,
                            s.formatFecha,
                            s.formatMes
                          );
                        }
                      }}
                    >
                      🧾
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}