export const currencies = ['USD','KRW','JPY','EUR'] as const;
export function digits(currency: string) {
 if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Choose an uppercase three-letter currency.');
 return new Intl.NumberFormat('en-US',{style:'currency',currency}).resolvedOptions().maximumFractionDigits ?? 2;
}
export function parseMoney(amount: string, currency: string) {
 const d=digits(currency);
 if (!/^\d+(\.\d+)?$/.test(amount.trim())) throw new Error('Enter a positive cash amount.');
 const [whole,fraction='']=amount.trim().split('.');
 if(fraction.length>d) throw new Error('Too many decimal places for this currency.');
 const n=BigInt(whole)*10n**BigInt(d)+BigInt(fraction.padEnd(d,'0')||'0');
 if(n<=0n || n>BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Cash amount is outside the supported range.');
 return Number(n);
}
export function amountFromMinor(n: number,currency: string) {
 const d=digits(currency), s=BigInt(n).toString().padStart(d+1,'0');
 return d ? s.slice(0,-d)+'.'+s.slice(-d) : s;
}
export function formatMoney(n: number,currency: string) {
 const [whole,fraction]=amountFromMinor(n,currency).split('.');
 return new Intl.NumberFormat('en-US',{style:'currency',currency}).formatToParts(BigInt(whole)).map(part=>part.type==='fraction'?fraction:part.value).join('');
}
