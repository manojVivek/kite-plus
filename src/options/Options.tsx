import {useState, useEffect} from 'react';

export const Options = () => {
  const [xirrEnabled, setXirrEnabled] = useState(true);
  const [hoverFundamentalsEnabled, setHoverFundamentalsEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(['xirrEnabled'], result => {
      setXirrEnabled(Boolean(result.xirrEnabled));
    });
  }, []);

  return (
    <main className="flex flex-col gap-8 m-8 min-w-[400px]">
      <div>
        <h1 className="text-2xl">Kite Plus Extension</h1>
        <p>An extension that adds some cool new features to Kite.</p>
      </div>

      <div>
        <h2 className="text-lg mb-4">Preferences</h2>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              id="xirrEnabled"
              type="checkbox"
              checked={xirrEnabled}
              onChange={e => {
                setXirrEnabled(e.target.checked);
                chrome.storage.sync.set({xirrEnabled: e.target.checked});
              }}
            />
            <label htmlFor="xirrEnabled">XIRR field</label>
          </div>
          <div className="flex gap-2">
            <input
              id="onHoverFundamentals"
              type="checkbox"
              checked={hoverFundamentalsEnabled}
              onChange={e => {
                setHoverFundamentalsEnabled(e.target.checked);
                chrome.storage.sync.set({hoverFundamentalsEnabled: e.target.checked});
              }}
            />
            <label htmlFor="onHoverFundamentals">
              Show Fundamentals on mouse over a Ticker symbol
            </label>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Options;
