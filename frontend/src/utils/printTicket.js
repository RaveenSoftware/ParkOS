export function printTicket(data) {
  const {
    type, // 'ENTRY' | 'EXIT'
    tenantName = 'ParkOS',
    tenantDoc = '',
    tenantAddress = '',
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
            font-size: 13px;
            color: #000;
            width: 80mm;
            padding: 2mm 5mm;
            margin: 0 auto;
            text-align: center;
          }
          h1 { font-size: 24px; margin: 0 0 5px 0; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
          .header-info { font-size: 11px; margin-bottom: 2px; }
          h2 { font-size: 16px; margin: 0; padding: 5px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .left { text-align: left; }
          .right { text-align: right; }
          .center { text-align: center; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .bold { font-weight: bold; }
          .plate { 
            font-size: 32px; 
            font-weight: 900; 
            border: 2px solid #000; 
            padding: 8px 0; 
            margin: 12px 0; 
            border-radius: 4px;
            letter-spacing: 3px;
          }
          .footer-msg { font-size: 12px; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <h1>${tenantName}</h1>
        ${tenantDoc ? `<div class="header-info">NIT: ${tenantDoc}</div>` : ''}
        ${tenantAddress ? `<div class="header-info">Dirección: ${tenantAddress}</div>` : ''}
        ${sedeName ? `<div class="header-info">Sede: ${sedeName}</div>` : ''}
        
        <div style="margin-top: 10px;"></div>
        
        <h2>TICKET DE ${type === 'ENTRY' ? 'ENTRADA' : 'SALIDA'}</h2>
        <div style="margin-top: 5px; font-size: 14px;">Ticket #${ticketId}</div>
        
        <div class="plate">${plate}</div>
        
        <div class="row">
          <span class="left">Tipo de vehículo:</span>
          <span class="right bold">${vehicleType || 'NO ASIGNADO'}</span>
        </div>
        ${spotCode ? `
        <div class="row">
          <span class="left">Plaza asignada:</span>
          <span class="right bold">${spotCode}</span>
        </div>` : ''}
        
        <div class="divider"></div>
        
        <div class="row">
          <span class="left">Hora Entrada:</span>
          <span class="right">${new Date(entryTime).toLocaleString('es-CO', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        ${type === 'EXIT' ? `
        <div class="row">
          <span class="left">Hora Salida:</span>
          <span class="right">${new Date(exitTime).toLocaleString('es-CO', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="row">
          <span class="left">Tiempo total:</span>
          <span class="right">${duration}</span>
        </div>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 18px; margin-top: 8px;">
          <span class="left">TOTAL A PAGAR:</span>
          <span class="right">${amount}</span>
        </div>
        ` : ''}

        ${(clientName || clientDoc) ? `
        <div class="divider"></div>
        <div class="left bold" style="margin-bottom: 4px;">Datos del Cliente:</div>
        ${clientName ? `<div class="left">Nombre: ${clientName}</div>` : ''}
        ${clientDoc ? `<div class="left">CC/NIT: ${clientDoc}</div>` : ''}
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="footer-msg">Conserve este ticket para su salida.</div>
        <div class="footer-msg" style="margin-top: 5px;">¡Gracias por su visita!</div>
        
        <div style="margin-top: 20px;">-</div>
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
