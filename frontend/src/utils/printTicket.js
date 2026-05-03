export function printTicket(data) {
  const {
    type, // 'ENTRY' | 'EXIT'
    tenantName = 'ParkOS',
    tenantDoc = '',
    sedeName = '',
    ticketId,
    plate,
    vehicleType,
    entryTime,
    exitTime,
    duration,
    amount,
    spotCode,
    clientName,
    clientDoc
  } = data;

  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;

  const html = `
    <html>
      <head>
        <title>Imprimir Ticket</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            width: 80mm;
            padding: 5mm;
            margin: 0 auto;
            text-align: center;
          }
          h1 { font-size: 16px; margin: 0 0 5px 0; }
          h2 { font-size: 14px; margin: 0 0 5px 0; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .left { text-align: left; }
          .right { text-align: right; }
          .center { text-align: center; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .bold { font-weight: bold; }
          .plate { font-size: 24px; font-weight: bold; border: 2px solid #000; padding: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>${tenantName}</h1>
        ${tenantDoc ? `<div>NIT/RUT: ${tenantDoc}</div>` : ''}
        ${sedeName ? `<div>Sede: ${sedeName}</div>` : ''}
        
        <div class="divider"></div>
        
        <h2>TICKET DE ${type === 'ENTRY' ? 'ENTRADA' : 'SALIDA'}</h2>
        <div>Ticket #${ticketId}</div>
        
        <div class="plate">${plate}</div>
        
        <div class="row">
          <span class="left">Tipo:</span>
          <span class="right">${vehicleType}</span>
        </div>
        ${spotCode ? `
        <div class="row">
          <span class="left">Plaza:</span>
          <span class="right bold">${spotCode}</span>
        </div>` : ''}
        
        <div class="divider"></div>
        
        <div class="row">
          <span class="left">Entrada:</span>
          <span class="right">${new Date(entryTime).toLocaleString('es-CO')}</span>
        </div>
        
        ${type === 'EXIT' ? `
        <div class="row">
          <span class="left">Salida:</span>
          <span class="right">${new Date(exitTime).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="left">Tiempo:</span>
          <span class="right">${duration}</span>
        </div>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 16px;">
          <span class="left">TOTAL:</span>
          <span class="right">${amount}</span>
        </div>
        ` : ''}

        ${(clientName || clientDoc) ? `
        <div class="divider"></div>
        <div class="left bold">Datos del Cliente:</div>
        ${clientName ? `<div class="left">Nombre: ${clientName}</div>` : ''}
        ${clientDoc ? `<div class="left">Doc: ${clientDoc}</div>` : ''}
        ` : ''}
        
        <div class="divider"></div>
        <div>Conserve este ticket para su salida.</div>
        <div style="margin-top: 10px;">¡Gracias por su visita!</div>
      </body>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </html>
  `;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
