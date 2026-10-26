import { SITE } from '../config';

// Las fechas del contenido son días sin hora (medianoche UTC), así que se formatean en UTC.
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', { ...opts, timeZone: 'UTC' });
const larga = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
const corta = fmt({ day: 'numeric', month: 'short', year: 'numeric' });
const mes = fmt({ month: 'short' });

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const fechaLarga = (d: Date) => larga.format(d);
export const fechaCorta = (d: Date) => corta.format(d).replace('.', '');
export const mesCorto = (d: Date) => mes.format(d).replace('.', '');
export const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: SITE.zonaHoraria }).format(new Date());
