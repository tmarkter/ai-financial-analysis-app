import { useEffect, useState } from "react";

export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>, 
  deps: any[] = []
) {
  const [state, setState] = useState<{ 
    loading: boolean; 
    data?: T; 
    error?: string 
  }>({ loading: true });

  useEffect(() => {
    const ctl = new AbortController();
    let done = false;
    setState({ loading: true });

    const t = setTimeout(() => {
      if (!done) {
        setState({ 
          loading: false, 
          error: "Request timed out. Please try again." 
        });
      }
    }, 15000);

    fn(ctl.signal).then(
      (data) => { 
        done = true; 
        clearTimeout(t); 
        setState({ loading: false, data }); 
      },
      (err) => { 
        done = true; 
        clearTimeout(t); 
        if (!ctl.signal.aborted) {
          setState({ 
            loading: false, 
            error: err?.message ?? "Failed to load data." 
          }); 
        }
      }
    );

    return () => { 
      ctl.abort(); 
      clearTimeout(t); 
    };
  }, deps);

  return state;
}
