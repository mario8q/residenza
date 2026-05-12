import { useState, useCallback } from 'react';

let _add = null;
export const useToast = () => ({
  success: (msg) => _add?.({msg,type:'success'}),
  error:   (msg) => _add?.({msg,type:'error'}),
  info:    (msg) => _add?.({msg,type:'info'}),
  warning: (msg) => _add?.({msg,type:'warning'}),
});
const ICONS = {success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _add = useCallback(({msg,type}) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3200);
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t=>(
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{ICONS[t.type]}</span><span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
