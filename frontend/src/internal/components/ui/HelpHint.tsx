type HelpHintProps = {
  text: string;
};

export function HelpHint({ text }: HelpHintProps) {
  return (
    <span aria-label={text} className="help-hint" role="note" tabIndex={0}>
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.9 7.6a1.7 1.7 0 1 1 2.2 1.63c-.72.27-1.1.7-1.1 1.47v.34" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        <circle cx="10" cy="13.9" r="0.9" fill="currentColor" />
      </svg>
      <span className="help-tooltip">{text}</span>
    </span>
  );
}
