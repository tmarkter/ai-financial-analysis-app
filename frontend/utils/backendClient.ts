import originalBackend from "~backend/client";

const backend = new Proxy(originalBackend, {
  get(target, prop) {
    const value = (target as any)[prop];
    
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(serviceTarget, serviceProp) {
          const serviceValue = (serviceTarget as any)[serviceProp];
          
          if (typeof serviceValue === 'function') {
            return async function(this: any, ...args: any[]) {
              const originalWebSocket = window.WebSocket;
              
              window.WebSocket = new Proxy(originalWebSocket, {
                construct(target, constructArgs) {
                  let url = constructArgs[0];
                  if (typeof url === 'string' && url.startsWith('https://')) {
                    url = url.replace('https://', 'wss://');
                  } else if (typeof url === 'string' && url.startsWith('http://')) {
                    url = url.replace('http://', 'ws://');
                  }
                  constructArgs[0] = url;
                  return Reflect.construct(target, constructArgs);
                }
              }) as any;
              
              try {
                return await serviceValue.apply(serviceTarget, args);
              } finally {
                window.WebSocket = originalWebSocket;
              }
            };
          }
          
          return serviceValue;
        }
      });
    }
    
    return value;
  }
});

export default backend;
