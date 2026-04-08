import type { PropsWithChildren, ReactNode } from "react";
import { HelpHint } from "./HelpHint";

type PanelProps = PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
  helpText?: string;
}>;

export function Panel({ title, description, actions, helpText, children }: PanelProps) {
  const panelHelp = helpText || description;

  return (
    <section className="panel">
      {(title || description || actions) && (
        <div className="panel-header">
          <div>
            {title && (
              <div className="panel-title-row">
                <h2>{title}</h2>
                {panelHelp ? <HelpHint text={panelHelp} /> : null}
              </div>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
