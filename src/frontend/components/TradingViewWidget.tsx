import React, { useEffect, useRef, memo, useId } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol: string;
}

const TradingViewWidget = ({ symbol }: TradingViewWidgetProps) => {
  const containerId = "tv_widget_" + useId().replace(/:/g, '');
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widget: any = null;

    function createWidget() {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        widget = new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "1",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_top_toolbar: false,
          details: true,
          hide_legend: false,
          withdateranges: true,
          allow_symbol_change: true,
          calendar: false,
          support_host: "https://www.tradingview.com",
          container_id: containerId
        });
      }
    }

    // Load tv.js if not already present
    if (typeof window.TradingView === 'undefined') {
      const existingScript = document.getElementById('tradingview-widget-loading-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = createWidget;
        document.head.appendChild(script);
      } else {
        // If it's already in the process of loading, listen for its load
        existingScript.addEventListener('load', createWidget, { once: true });
      }
    } else {
      createWidget();
    }

    return () => {
      if (widget && typeof widget.remove === 'function') {
        try {
          if (document.getElementById(containerId)) {
            widget.remove();
          }
        } catch (e) {
          // Silent catch: React may have already unmounted the parent DOM node
        }
      }
    };
  }, [symbol, containerId]);

  return (
    <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
      <div id={containerId} ref={container} style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewWidget);
