type Props={label:string;selected:boolean;onPress:()=>void;disabled?:boolean;single?:boolean};
export function Choice({label,selected,onPress,disabled}:Props){
 return <button type="button" role="radio" aria-label={label} aria-checked={selected} disabled={disabled} onClick={onPress}
 className={'min-h-14 rounded-button border px-md py-md text-left text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand '+(selected?'border-brand bg-brand font-semibold text-on-brand':'border-light-border bg-light-surface text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text')}>
 {selected?'✓ ':''}{label}</button>;
}
