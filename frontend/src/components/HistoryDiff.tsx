import { ArrowRight, Plus, Minus } from "lucide-react";

interface Item {
  product_name?: string;
  quantity?: number | string;
  unit?: string;
}

export default function HistoryDiff({ before, after }: { before: any; after: any }) {
  if (!before && !after) return null;

  // Normalise items if they are wrapped in an object (e.g. {"items": [...]})
  const getItems = (obj: any): Item[] | null => {
    if (Array.isArray(obj)) return obj;
    if (obj && Array.isArray(obj.items)) return obj.items;
    return null;
  };

  const beforeItems = getItems(before);
  const afterItems = getItems(after);

  // 1. CREATION (before is null/empty and after has items)
  if (!beforeItems && !before && afterItems) {
    if (afterItems.length === 0) return null;
    return (
      <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded p-2">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Initial order</p>
        <ul className="space-y-1">
          {afterItems.map((item, idx) => (
            <li key={idx} className="font-mono text-xs">
              • {item.quantity} {item.unit || "kg"} {item.product_name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 2. ITEM ARRAYS
  if (beforeItems && afterItems) {
    const beforeMap = new Map<string, Item>();
    beforeItems.forEach(i => { if (i.product_name) beforeMap.set(i.product_name.toLowerCase(), i); });
    
    const afterMap = new Map<string, Item>();
    afterItems.forEach(i => { if (i.product_name) afterMap.set(i.product_name.toLowerCase(), i); });

    const allKeys = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]));
    const changes: React.ReactNode[] = [];
    
    allKeys.forEach(key => {
      const b = beforeMap.get(key);
      const a = afterMap.get(key);
      const name = b?.product_name || a?.product_name || key;
      
      if (!b && a) {
        // added
        changes.push(
          <div key={key} className="flex items-center text-green-700 font-mono text-xs">
            <Plus size={12} className="mr-1" />
            <span>{a.quantity} {a.unit || "kg"} {name}</span>
          </div>
        );
      } else if (b && !a) {
        // removed
        changes.push(
          <div key={key} className="flex items-center text-red-700 font-mono text-xs line-through opacity-70">
            <Minus size={12} className="mr-1" />
            <span>{b.quantity} {b.unit || "kg"} {name}</span>
          </div>
        );
      } else if (b && a) {
        // changed?
        const qB = String(b.quantity);
        const qA = String(a.quantity);
        const uB = b.unit || "kg";
        const uA = a.unit || "kg";
        
        if (qB !== qA || uB !== uA) {
          changes.push(
            <div key={key} className="flex items-center text-gray-700 font-mono text-xs">
              <span className="w-24 truncate mr-2" title={name}>{name}</span>
              <span className="line-through text-gray-400 mr-2">{qB} {uB}</span>
              <ArrowRight size={10} className="text-gray-400 mr-2" />
              <span className="text-gray-900 font-semibold">{qA} {uA}</span>
            </div>
          );
        }
      }
    });
    
    if (changes.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1 bg-gray-50 border border-gray-100 rounded p-2">
        {changes}
      </div>
    );
  }

  // 3. SCALAR FIELDS
  const bObj = typeof before === "object" && before !== null && !Array.isArray(before) ? before : {};
  const aObj = typeof after === "object" && after !== null && !Array.isArray(after) ? after : {};
  
  const scalarKeys = Array.from(new Set([...Object.keys(bObj), ...Object.keys(aObj)]));
  if (scalarKeys.length === 0) return null;
  
  const changes: React.ReactNode[] = [];
  scalarKeys.forEach(key => {
    const bVal = bObj[key];
    const aVal = aObj[key];
    
    if (bVal === aVal) return;
    
    // Ignore complex objects, focus on scalars
    if (typeof bVal === "object" && bVal !== null) return;
    if (typeof aVal === "object" && aVal !== null) return;
    
    changes.push(
      <div key={key} className="flex items-center text-xs font-mono text-gray-700">
        <span className="text-gray-500 mr-2 min-w-16 truncate">{key}:</span>
        {bVal !== undefined && bVal !== null && (
          <span className="line-through text-gray-400 mr-2">{String(bVal)}</span>
        )}
        {bVal !== undefined && bVal !== null && aVal !== undefined && aVal !== null && (
           <ArrowRight size={10} className="text-gray-400 mr-2" />
        )}
        {aVal !== undefined && aVal !== null && (
          <span className="text-gray-900 font-semibold">{String(aVal)}</span>
        )}
      </div>
    );
  });
  
  if (changes.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-1 bg-gray-50 border border-gray-100 rounded p-2">
      {changes}
    </div>
  );
}
